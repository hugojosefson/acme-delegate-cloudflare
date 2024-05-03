import { Domain, isDomain } from "./domain.ts";
import {
  DefaultModeRequest,
  isDefaultModeRequest,
  RawModeRequest,
  ValidRequest,
} from "./request.ts";

export function getDomainFromDefaultModeRequest(
  req: DefaultModeRequest,
): Domain {
  const domain = req.fqdn.slice("_acme-challenge.".length, -1);
  if (!isDomain(domain)) {
    throw new Error(`Invalid domain: ${domain}`);
  }
  return domain;
}

export function getDomainFromRawModeRequest(
  req: RawModeRequest,
): Domain {
  return req.domain;
}

export function getDomainFromRequest(
  req: ValidRequest,
): Domain {
  if (isDefaultModeRequest(req)) {
    return getDomainFromDefaultModeRequest(req);
  }
  return getDomainFromRawModeRequest(req);
}
