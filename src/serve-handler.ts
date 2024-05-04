import { not } from "https://deno.land/x/fns@1.1.1/fn/not.ts";
import { s } from "https://deno.land/x/fns@1.1.1/string/s.ts";
import { FQDomain, resolveDomainRecursivelyToIps } from "./domain.ts";
import { getDomainFromRequest } from "./get-domain-from-request.ts";
import {
  IpAddressString,
  isInternalIpAddressString,
  isIpAddressString,
} from "./ip.ts";
import { log, logWithBody } from "./log.ts";
import {
  DefaultModeFqdn,
  DefaultModeRequest,
  ensureDefaultModeRequest,
  isValidRequest,
  ValidRequest,
} from "./request.ts";
import { respond } from "./response.ts";
import { deleteTxtRecord, setTxtRecord } from "./cloudflare-dns.ts";

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
  const fqdn: FQDomain = getDomainFromRequest(validRequest);
  const domainIps: IpAddressString[] = await resolveDomainRecursivelyToIps(
    fqdn,
  );
  if (domainIps.some(not(isInternalIpAddressString))) {
    return log(
      req,
      info,
      respond(403),
      `invalid domain: ${
        s(fqdn)
      } because it resolves to at least one external IP: ${s(domainIps)}`,
    );
  }
  if (!domainIps.includes(ip)) {
    return log(
      req,
      info,
      respond(403),
      `invalid domain: ${
        s(fqdn)
      } because it does not resolve to the caller's IP: ${s(ip)}`,
    );
  }

  const defaultModeRequest: DefaultModeRequest = await ensureDefaultModeRequest(
    validRequest,
  );

  if (path === "/present") {
    await setTxtRecord(
      `_acme-challenge.${fqdn}` as DefaultModeFqdn,
      defaultModeRequest.value,
    );
    return log(req, info, respond(200), `set ${s(defaultModeRequest)}`);
  }

  if (path === "/cleanup") {
    await deleteTxtRecord(
      `_acme-challenge.${fqdn}` as DefaultModeFqdn,
      defaultModeRequest.value,
    );
    return log(req, info, respond(200), `deleted ${s(defaultModeRequest)}`);
  }

  return log(req, info, respond(404), `unexpected path: ${s(path)}`);
};
