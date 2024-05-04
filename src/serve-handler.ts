import { not } from "https://deno.land/x/fns@1.1.1/fn/not.ts";
import { s } from "https://deno.land/x/fns@1.1.1/string/s.ts";
import { FQDomain, resolveDomainRecursivelyToIps } from "./domain.ts";
import { getFQDomainFromRequest } from "./get-domain-from-request.ts";
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
import { isAllowedHttpHost } from "./config.ts";
import { swallow } from "https://deno.land/x/fns@1.1.1/fn/swallow.ts";

export const serveHandler: Deno.ServeHandler = async (
  req: Request,
  info: Deno.ServeHandlerInfo,
): Promise<Response> => {
  const { method, url: urlString } = req;
  const { remoteAddr } = info;

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

  const url = new URL(urlString);
  const host = url.host;
  if (!isAllowedHttpHost(host)) {
    return log(req, info, respond(404), `not allowed host: ${s(host)}`);
  }

  const path = url.pathname;
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

  const bodyString = await req.text();
  const jsonParseErrorSymbol = Symbol("jsonParseError");
  const body =
    await (new Promise((resolve) => void resolve(JSON.parse(bodyString))))
      .catch(swallow(Error, jsonParseErrorSymbol));
  if (body === jsonParseErrorSymbol) {
    return log(
      req,
      info,
      respond(400),
      `body is not valid JSON: ${s(bodyString)}`,
    );
  }
  if (!isValidRequest(body)) {
    return await logWithBody(req, info, respond(400), "invalid request");
  }

  const validRequest: ValidRequest = body;
  const fqdn: FQDomain = getFQDomainFromRequest(validRequest);
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
