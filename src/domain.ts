import { swallow } from "https://deno.land/x/fns@1.1.1/fn/swallow.ts";
import { s } from "https://deno.land/x/fns@1.1.1/string/s.ts";
import { not } from "https://deno.land/x/fns@1.1.1/fn/not.ts";

import { RECORD_TYPES, ResolveDnsResponse } from "./dns.ts";
import { IpAddressString, isIpAddressString } from "./ip.ts";

export type Domain = `${string}.${string}`;

export function isDomain(s: unknown): s is Domain {
  if (typeof s !== "string") {
    return false;
  }
  return /^[^.]+(\.[^.]+)+$/.test(s);
}

export async function resolveDomainToIps(
  domain: Domain,
): Promise<IpAddressString[]> {
  console.log(`Resolving ${domain}`);
  const promises: Promise<ResolveDnsResponse>[] = RECORD_TYPES.map((type) =>
    Deno.resolveDns(domain, type).catch(swallow(Deno.errors.NotFound, []))
  );

  const resolved: ResolveDnsResponse[] = await Promise.all(promises);
  console.log(`Resolved ${domain}: ${s(resolved)}`);

  const records = [...new Set(resolved.flat(2) as string[])].sort();
  console.log(`Unique records for ${domain}: ${s(records)}`);

  const ips: IpAddressString[] = records.filter(isIpAddressString);
  console.log(`IPs for ${domain}: ${s(ips)}`);

  const domains: Domain[] = records
    .filter(not(isIpAddressString))
    .map((record) => record.replace(/\.$/, ""))
    .filter(isDomain);
  console.log(`Domains for ${domain}: ${s(domains)}`);

  const resolvedDomains = (await Promise.all(domains.map(resolveDomainToIps)))
    .flat(
      2,
    );
  console.log(`Resolved domains for ${domain}: ${s(resolvedDomains)}`);

  console.log(`Returning ${s([...ips, ...resolvedDomains])} for ${domain}.`);
  return [...ips, ...resolvedDomains];
}
