import { isString } from "https://deno.land/x/fns@1.1.1/string/is-string.ts";
import { s } from "https://deno.land/x/fns@1.1.1/string/s.ts";
import Cloudflare from "npm:cloudflare@3.1.0";
import {
  type Zone,
  type ZoneListParams,
  type ZonesV4PagePaginationArray,
} from "npm:cloudflare@3.1.0/resources/zones/zones";
import { findInAsyncIterable } from "./async-iterable.ts";
import {
  Domain,
  ensureDomain,
  ensureFQDomain,
  FQDomain,
  isDomain,
  isDomainOrFQDomain,
} from "./domain.ts";
import { DefaultModeFqdn } from "./request.ts";
import { splitFqdn } from "./split-fqdn.ts";

const CF = new Cloudflare({
  apiEmail: Deno.env.get("CF_API_EMAIL")!,
  apiKey: Deno.env.get("CF_API_KEY")!,
  apiToken: Deno.env.get("CF_API_TOKEN")!,
});

export type RecordName = Domain & { readonly __isRecordName: unique symbol };
export function isRecordName(s: unknown): s is RecordName {
  return isDomain(s) ||
    isString(s) && (s === "_acme-challenge" || /^[a-z0-9]$/.test(s));
}

export function getDomainFromDefaultModeFqdn(fqdn: DefaultModeFqdn): Domain {
  return fqdn.slice("_acme-challenge.".length, -1) as Domain;
}

async function findZoneId(
  defaultModeFqdn: DefaultModeFqdn,
): Promise<string> {
  const fqdns: FQDomain[] = splitFqdn(defaultModeFqdn);
  for (const fqdn of fqdns) {
    const query: ZoneListParams = {
      name: ensureFQDomain(fqdn),
    };
    const zones: ZonesV4PagePaginationArray = await CF.zones.list(query);
    const zone: Zone | undefined = await findInAsyncIterable(
      zones,
      (zone) =>
        isDomainOrFQDomain(zone.name) &&
        ensureFQDomain(zone.name) === ensureFQDomain(fqdn),
    );
    if (zone) {
      return zone.id;
    }
  }
  throw new Deno.errors.NotFound(`Zone not found for ${s(defaultModeFqdn)}`);
}

export async function setTxtRecord(
  fqdn: DefaultModeFqdn,
  value: string,
): Promise<void> {
  const zoneId = await findZoneId(fqdn);

  await CF.dns.records.create({
    zone_id: zoneId,
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

  const query = {
    zone_id: zoneId,
    type: "TXT",
    name: ensureDomain(fqdn),
    content: value,
  } as const;
  const dnsRecords = await CF.dns.records.list(query);

  const recordIds: string[] = dnsRecords.result
    .filter((record) => record.type === query.type)
    .filter((record) => record.name === query.name)
    .filter((record) => record.content === query.content)
    .map((record) => record.id)
    .filter(isString);

  console.log(`Deleting record ids ${s(recordIds)}`);

  await Promise.all(
    recordIds.map((recordId) =>
      CF.dns.records.delete(recordId, {
        zone_id: zoneId,
        body: undefined,
      })
    ),
  );
}
