import { encodeBase64Url } from "https://deno.land/std@0.224.0/encoding/base64url.ts";
import { Domain, FQDomain, isDomain, isFQDomain } from "./domain.ts";
import { sha256 } from "./sha256.ts";

export type DefaultModeFqdn = `_acme-challenge.${FQDomain}`;
export type DefaultModeRequest = {
  fqdn: DefaultModeFqdn;
  value: string;
};

export type RawModeRequest = {
  domain: Domain;
  token: string;
  keyAuth: string;
};

export type ValidRequest =
  | DefaultModeRequest
  | RawModeRequest;

export function isDefaultModeFqdn(s: unknown): s is DefaultModeFqdn {
  return isFQDomain(s) && s.startsWith("_acme-challenge.");
}

export function isDefaultModeRequest(
  o: unknown,
): o is DefaultModeRequest {
  if (typeof o !== "object") {
    console.log("not an object", o);
    return false;
  } else if (o === null) {
    console.log("null", o);
    return false;
  }
  const { fqdn, value } = o as Record<string, unknown>;
  if (!isDefaultModeFqdn(fqdn)) {
    console.log("not a default mode fqdn", fqdn);
    return false;
  }
  if (typeof value !== "string") {
    console.log("not a string", value);
    return false;
  }
  return true;
}

export function isRawModeRequest(
  o: unknown,
): o is RawModeRequest {
  if (typeof o !== "object" || o === null) {
    return false;
  }
  const { domain, token, keyAuth } = o as Record<string, unknown>;
  return isDomain(domain) && typeof token === "string" &&
    typeof keyAuth === "string";
}

export function isValidRequest(
  o: unknown,
): o is ValidRequest {
  return isDefaultModeRequest(o) || isRawModeRequest(o);
}

/**
 * Converts a {@link RawModeRequest} to a {@link DefaultModeRequest}.
 *
 * @param req The raw mode request.
 * @returns The default mode request.
 */
export async function rawModeRequestToDefaultModeRequest(
  req: RawModeRequest,
): Promise<DefaultModeRequest> {
  const digest: ArrayBuffer = await sha256(req.keyAuth);
  const value: string = encodeBase64Url(digest);
  return {
    fqdn: `_acme-challenge.${req.domain}.` as DefaultModeFqdn,
    value,
  };
}
