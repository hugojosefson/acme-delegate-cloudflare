import { s } from "https://deno.land/x/fns@1.1.1/string/s.ts";
import { Domain, resolveDomainToIps } from "./domain.ts";
import { getDomainFromRequest } from "./get-domain-from-request.ts";
import { isInternalIp, isIpAddressString } from "./ip.ts";
import {
  isDefaultModeRequest,
  isRawModeRequest,
  isValidRequest,
} from "./request.ts";

export const serveHandler: Deno.ServeHandler = async (
  req: Request,
  info: Deno.ServeHandlerInfo,
): Promise<Response> => {
  const { method, url } = req;
  const { remoteAddr } = info;
  const path = new URL(url).pathname;

  if (remoteAddr.transport !== "tcp") {
    throw new Error("Expected TCP transport");
  }

  const ip = remoteAddr.hostname;
  if (!isIpAddressString(ip)) {
    console.log(`${method} ${url} from ${ip}, invalid IP address.`);
    return new Response("Bad Request", {
      status: 400,
      statusText: "Bad Request",
    });
  }
  if (!isInternalIp(ip)) {
    console.log(`${method} ${url} from ${ip}, forbidden.`);
    return new Response(
      "Forbidden",
      {
        status: 403,
        statusText: "Forbidden",
      },
    );
  }

  if (method.toUpperCase() !== "POST") {
    console.log(
      `${method} ${path} from ${ip}, method not allowed.`,
    );
    return new Response("Method Not Allowed", {
      status: 405,
      statusText: "Method Not Allowed",
    });
  }

  const body = await req.json();
  console.log(
    `${method} ${path} from ${ip}, body: ${s(body)}, isDefaultModeRequest: ${
      isDefaultModeRequest(body)
    }, isRawModeRequest: ${isRawModeRequest(body)}.`,
  );

  if (path === "/present") {
    if (!isValidRequest(body)) {
      console.log(
        `${method} ${path} from ${ip}, invalid request.`,
      );
      return new Response("Bad Request", {
        status: 400,
        statusText: "Bad Request",
      });
    }

    const domain: Domain = getDomainFromRequest(body);
    console.log(
      `${method} ${path} from ${ip}, domain: ${domain}.`,
    );

    const resolvedDomains: string[] = await resolveDomainToIps(domain);
    console.log(
      `${method} ${path} from ${ip}, resolved domain: ${resolvedDomains}.`,
    );

    if (isDefaultModeRequest(req.body)) {
      console.log(
        `${method} ${path} from ${ip}, with a default mode request, allowed.`,
      );
    }
    console.log(`${method} ${path} from ${ip}, allowed.`);
  }
  return new Response("Not Found", { status: 404, statusText: "Not Found" });
};
