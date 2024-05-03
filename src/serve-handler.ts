import { not } from "https://deno.land/x/fns@1.1.1/fn/not.ts";
import { s } from "https://deno.land/x/fns@1.1.1/string/s.ts";
import { Domain, resolveDomainToIps } from "./domain.ts";
import { getDomainFromRequest } from "./get-domain-from-request.ts";
import { IpAddressString, isInternalIp, isIpAddressString } from "./ip.ts";
import { log, logWithBody } from "./log.ts";
import {
  isDefaultModeRequest,
  isRawModeRequest,
  isValidRequest,
} from "./request.ts";
import { respond } from "./response.ts";

export const serveHandler: Deno.ServeHandler = async (
  req: Request,
  info: Deno.ServeHandlerInfo,
): Promise<Response> => {
  const { method, url } = req;
  const { remoteAddr } = info;
  const path = new URL(url).pathname;

  if (remoteAddr.transport !== "tcp") {
    return log(
      req,
      info,
      respond(400),
      `unexpected transport: ${s(remoteAddr.transport)}`,
    );
  }

  const ip = remoteAddr.hostname;
  if (!isIpAddressString(ip)) {
    return log(req, info, respond(500), `invalid IP address: ${s(ip)}`);
  }
  if (!isInternalIp(ip)) {
    return log(req, info, respond(403), `not internal: ${s(ip)}`);
  }

  if (!["/present", "/cleanup"].includes(path)) {
    return log(req, info, respond(404), `unexpected path: ${s(path)}`);
  }

  if (method.toUpperCase() !== "POST") {
    return log(
      req,
      info,
      respond(405),
      s(method),
    );
  }

  const body = await req.json();
  if (!isValidRequest(body)) {
    return await logWithBody(req, info, respond(400), "invalid request");
  }

  const domain: Domain = getDomainFromRequest(body);
  const domainIps: IpAddressString[] = await resolveDomainToIps(domain);
  if (domainIps.some(not(isInternalIp))) {
    return log(
      req,
      info,
      respond(403),
      `invalid domain: ${
        s(domain)
      } because it resolves to at least one external IP: ${s(domainIps)}`,
    );
  }
  if (!domainIps.includes(ip)) {
    return log(
      req,
      info,
      respond(403),
      `invalid domain: ${
        s(domain)
      } because it does not resolve to the caller's IP: ${s(ip)}`,
    );
  }

  if (path === "/present") {
    if (isDefaultModeRequest(body)) {
      // TODO: implement
      return log(
        req,
        info,
        respond(200),
        `default mode request, allowed`,
      );
    }
    if (isRawModeRequest(body)) {
      // TODO: implement
      return log(
        req,
        info,
        respond(200),
        `raw mode request, allowed`,
      );
    }
    return log(
      req,
      info,
      respond(500),
      `valid request?, but neither default nor raw mode`,
    );
  }

  if (path === "/cleanup") {
    if (isDefaultModeRequest(body)) {
      // TODO: implement
      return log(
        req,
        info,
        respond(200),
        `default mode request, allowed`,
      );
    }
    if (isRawModeRequest(body)) {
      // TODO: implement
      return log(
        req,
        info,
        respond(200),
        `raw mode request, allowed`,
      );
    }
    return log(
      req,
      info,
      respond(500),
      `valid request?, but neither default nor raw mode`,
    );
  }

  return respond(404);
};
