import { not } from "https://deno.land/x/fns@1.1.1/fn/not.ts";
import { s } from "https://deno.land/x/fns@1.1.1/string/s.ts";
import { Domain, resolveDomainRecursivelyToIps } from "./domain.ts";
import { getDomainFromRequest } from "./get-domain-from-request.ts";
import {
  IpAddressString,
  isInternalIpAddressString,
  isIpAddressString,
} from "./ip.ts";
import { log, logWithBody } from "./log.ts";
import {
  DefaultModeRequest,
  isDefaultModeRequest,
  isValidRequest,
  rawModeRequestToDefaultModeRequest,
  ValidRequest,
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
  if (!isInternalIpAddressString(ip)) {
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

  const validRequest: ValidRequest = body;
  const domain: Domain = getDomainFromRequest(validRequest);
  const domainIps: IpAddressString[] = await resolveDomainRecursivelyToIps(
    domain,
  );
  if (domainIps.some(not(isInternalIpAddressString))) {
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

  const _defaultModeRequest: DefaultModeRequest =
    isDefaultModeRequest(validRequest)
      ? validRequest
      : await rawModeRequestToDefaultModeRequest(validRequest);

  if (path === "/present") {
    // TODO: implement using defaultModeRequest
  }

  if (path === "/cleanup") {
    // TODO: implement using defaultModeRequest
  }

  return log(req, info, respond(404), `unexpected path: ${s(path)}`);
};
