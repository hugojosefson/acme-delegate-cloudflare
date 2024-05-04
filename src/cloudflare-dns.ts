import Cloudflare from "npm:cloudflare@3.1.0";
import { type RecordDeleteParams } from "npm:cloudflare@3.1.0/resources/dns/records";
import {
  type Zone,
  type ZoneListParams,
  type ZonesV4PagePaginationArray,
} from "npm:cloudflare@3.1.0/resources/zones/zones";
import { findInAsyncIterable } from "./async-iterable.ts";
import { Domain, FQDomain, isDomain } from "./domain.ts";
import { DefaultModeFqdn, isDefaultModeFqdn } from "./request.ts";

const CF = new Cloudflare({
  apiEmail: Deno.env.get("CF_API_EMAIL")!,
  apiKey: Deno.env.get("CF_API_KEY")!,
  apiToken: Deno.env.get("CF_API_TOKEN")!,
});

export type RecordName = Domain & { readonly __isRecordName: unique symbol };
export function isRecordName(s: unknown): s is RecordName {
  return isDomain(s);
}

export function getDomainFromDefaultModeFqdn(fqdn: DefaultModeFqdn): Domain {
  return fqdn.slice("_acme-challenge.".length, -1) as Domain;
}

async function findZoneId(fqdn: DefaultModeFqdn): Promise<string> {
  const query: ZoneListParams = {
    name: getDomainFromDefaultModeFqdn(fqdn),
  };
  const zones: ZonesV4PagePaginationArray = await CF.zones.list(query);
  const zone: Zone | undefined = await findInAsyncIterable(
    zones,
    (zone) => zone.name === query.name,
  );
  if (!zone) {
    throw new Error(`Zone not found: ${query.name}`);
  }
  return zone.id;
}

export async function setTxtRecord(
  fqdn: DefaultModeFqdn,
  value: string,
): Promise<void> {
  await CF.dns.records.create({
    zone_id: await findZoneId(fqdn),
    type: "TXT",
    name: fqdn,
    content: value,
  });
}

export async function deleteTxtRecord(
  fqdn: DefaultModeFqdn,
  value: string,
): Promise<void> {
  const zoneId = await findZoneId(fqdn);
  const dnsRecords = await CF.dns.records.list({
    zone_id: zoneId,
    type: "TXT",
    name: fqdn,
    content: value,
  });
  for (const dnsRecord of dnsRecords.result) {
    if (dnsRecord.id === undefined) continue;
    const deleteParams: RecordDeleteParams = {
      zone_id: zoneId,
      body: undefined,
    };
    await CF.dns.records.delete(dnsRecord.id, deleteParams);
  }
}

/**
 * Splits a {@link DefaultModeFqdn} into all possible record names and domains.
 *
 * @example
 * ```ts
 * splitFqdn("_acme-challenge.local.hugojosefson.net.")
 * // => [
 * //   ["_acme-challenge", "local.hugojosefson.net."],
 * //   ["_acme-challenge.local", "hugojosefson.net."],
 * //   ["_acme-challenge.local.hugojosefson", "net."],
 * // ]
 * ```
 * @param fqdn The default mode fqdn.
 * @returns The record names and domains.
 */
export function splitFqdn(_fqdn: FQDomain): [RecordName, FQDomain][] {
  // TODO: implement
  return [];
}

if (import.meta.main) {
  const fqdns = [
    "_acme-challenge.hugojosefson.net.",
    "_acme-challenge.hugojosefson.com.",
    "_acme-challenge.local.hugojosefson.net.",
    "_acme-challenge.local.hugojosefson.com.",
    "_acme-challenge.hugojosefson.se.",
    "_acme-challenge.local.hugojosefson.se.",
  ].filter(isDefaultModeFqdn);
  const entries: [DefaultModeFqdn, string][] = await Promise.all(
    fqdns.map(async (fqdn) => [fqdn, await findZoneId(fqdn)]),
  );
  const obj = Object.fromEntries(entries);
  console.table(obj);
}
