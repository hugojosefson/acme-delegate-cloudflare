import { ensureFQDomain, FQDomain, isDomainOrFQDomain } from "./domain.ts";
import {
  DefaultModeRequest,
  isDefaultModeRequest,
  RawModeRequest,
  ValidRequest,
} from "./request.ts";

export function getFQDomainFromDefaultModeRequest(
  req: DefaultModeRequest,
): FQDomain {
  const domain = req.fqdn.slice("_acme-challenge.".length, -1);
  if (!isDomainOrFQDomain(domain)) {
    throw new Error(`Invalid domain: ${domain}`);
  }
  return ensureFQDomain(domain);
}

export function getFQDomainFromRawModeRequest(
  req: RawModeRequest,
): FQDomain {
  if (!isDomainOrFQDomain(req.domain)) {
    throw new Error(`Invalid domain: ${req.domain}`);
  }
  return ensureFQDomain(req.domain);
}

export function getFQDomainFromRequest(
  req: ValidRequest,
): FQDomain {
  if (isDefaultModeRequest(req)) {
    return getFQDomainFromDefaultModeRequest(req);
  }
  return getFQDomainFromRawModeRequest(req);
}
