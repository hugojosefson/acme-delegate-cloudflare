import { Domain, isDomain } from "./domain.ts";

export type DefaultModeFqdn = `_acme-challenge.${Domain}.`;
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
  if (typeof s !== "string") {
    return false;
  }
  return /^_acme-challenge\.[^.]+(\.[^.]+)+\.$/.test(s);
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
