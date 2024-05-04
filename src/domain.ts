import { or } from "https://deno.land/x/fns@1.1.1/fn/or.ts";
import { swallow } from "https://deno.land/x/fns@1.1.1/fn/swallow.ts";
import { s } from "https://deno.land/x/fns@1.1.1/string/s.ts";
import { sortUnique } from "https://raw.githubusercontent.com/hugojosefson/fns/sort-unique-generic/string/sort-unique.ts";
import isRfc2181DomainName from "npm:is-domain-name@1.0.1";

import { RECORD_TYPES, ResolveDnsResponse } from "./dns.ts";
import { IpAddressString, isIpAddressString } from "./ip.ts";
import { isString } from "https://deno.land/x/fns@1.1.1/string/is-string.ts";

export type Domain = string & { readonly __isDomain: unique symbol };
export type FQDomain = `${Domain}.` & { readonly __isFQDomain: unique symbol };
export type DomainOrFQDomain = Domain | FQDomain;

export function isRfc2181DomainNameOrAcmeChallenge(
  s: unknown,
  rootDot: true,
): s is FQDomain;
export function isRfc2181DomainNameOrAcmeChallenge(
  s: unknown,
  rootDot: false,
): s is Domain;
export function isRfc2181DomainNameOrAcmeChallenge(
  s: unknown,
  rootDot: boolean,
): boolean {
  if (isIpAddressString(s)) {
    return false;
  }
  if (isRfc2181DomainName(s, rootDot)) {
    return true;
  }
  if (!isString(s)) {
    return false;
  }
  const [host, ...rest] = s.split(".");
  return host === "_acme-challenge" &&
    isRfc2181DomainName(rest.join("."), rootDot);
}

export function isDomain(s: unknown): s is Domain {
  return isRfc2181DomainNameOrAcmeChallenge(s, false);
}

export function isFQDomain(s: unknown): s is FQDomain {
  return isRfc2181DomainNameOrAcmeChallenge(s, true);
}

export function isDomainOrFQDomain(s: unknown): s is DomainOrFQDomain {
  return isDomain(s) || isFQDomain(s);
}

export function toFQDomain(s: Domain): FQDomain {
  return `${s}.` as FQDomain;
}

export function toDomain(s: FQDomain): Domain {
  return s.slice(0, -1) as Domain;
}

export function ensureFQDomain(s: Domain | FQDomain): FQDomain {
  return isFQDomain(s) ? s : toFQDomain(s);
}

export function ensureDomain(s: Domain | FQDomain): Domain {
  return isDomain(s) ? s : toDomain(s);
}

export async function resolveDomain(
  domain: Domain | FQDomain,
): Promise<Array<FQDomain | IpAddressString>> {
  const domainFQ: FQDomain = ensureFQDomain(domain);

  const promises: Promise<ResolveDnsResponse>[] = RECORD_TYPES.map((type) =>
    Deno.resolveDns(domainFQ, type).catch(swallow(Deno.errors.NotFound, []))
  );
  const resolved: ResolveDnsResponse[] = await Promise.all(promises);

  /** because of the {@link RECORD_TYPES}, responses are always strings*/
  const toFilter = resolved.flat(2) as string[];
  const domains: Domain[] = toFilter.filter(isDomain);
  const domainsAsFqDomains: FQDomain[] = domains.map(toFQDomain);
  return sortUnique([
    ...domainsAsFqDomains,
    ...toFilter.filter(or(isFQDomain, isIpAddressString)) as Array<
      FQDomain | IpAddressString
    >,
  ]);
}

export async function resolveDomainRecursivelyToIps(
  domain: Domain | FQDomain,
): Promise<IpAddressString[]> {
  const fqDomain: FQDomain = ensureFQDomain(domain);
  console.log(`Resolving ${fqDomain} recursively`);

  const records = await resolveDomain(fqDomain);
  console.log(`Unique records for ${fqDomain}: ${s(records)}`);

  const ips: IpAddressString[] = records.filter(isIpAddressString);
  console.log(`IPs for ${fqDomain}: ${s(ips)}`);

  const fqDomains: FQDomain[] = records.filter(isFQDomain);
  console.log(`FQDomains for ${fqDomain}: ${s(fqDomains)}`);

  const fqDomainsAsIps =
    (await Promise.all(fqDomains.map(resolveDomainRecursivelyToIps)))
      .flat(
        2,
      );
  console.log(`fqDomainsAsIps for ${fqDomain}: ${s(fqDomainsAsIps)}`);

  const result: IpAddressString[] = sortUnique([...ips, ...fqDomainsAsIps]);
  console.log(`Returning ${s(result)} for ${fqDomain}.`);
  return result;
}

if (import.meta.main) {
  const domains = Deno.args.filter(isDomainOrFQDomain);
  const entries: [DomainOrFQDomain, IpAddressString[]][] = await Promise.all(
    domains.map(async (
      domain,
    ) => [domain, await resolveDomainRecursivelyToIps(domain)]),
  );
  const obj = Object.fromEntries(entries);
  console.table(obj);
}
