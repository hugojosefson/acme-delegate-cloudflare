import Cloudflare from "npm:cloudflare@3.1.0";
import {
  type ZoneListParams,
} from "npm:cloudflare@3.1.0/resources/zones/zones";
import {
  type RecordDeleteParams,
} from "npm:cloudflare@3.1.0/resources/dns/records";
import { Domain } from "./domain.ts";
import { DefaultModeFqdn } from "./request.ts";

const CF = new Cloudflare({
  apiEmail: Deno.env.get("CF_API_EMAIL")!,
  apiKey: Deno.env.get("CF_API_KEY")!,
  apiToken: Deno.env.get("CF_API_TOKEN")!,
});

export function getDomainFromDefaultModeFqdn(fqdn: DefaultModeFqdn): Domain {
  return fqdn.slice("_acme-challenge.".length, -1) as Domain;
}

async function findZoneId(fqdn: DefaultModeFqdn): Promise<string> {
  const query: ZoneListParams = {
    name: getDomainFromDefaultModeFqdn(fqdn),
  };
  const zones = await CF.zones.list(query);
  const zone = zones.result.find((zone) => zone.name === query.name);
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

if (import.meta.main) {
  const fqdns = [
    "_acme-challenge.hugojosefson.net.",
    "_acme-challenge.hugojosefson.com.",
    "_acme-challenge.local.hugojosefson.net.",
    "_acme-challenge.local.hugojosefson.com.",
    "_acme-challenge.hugojosefson.se.",
    "_acme-challenge.local.hugojosefson.se.",
  ] as const;
  const entries: [DefaultModeFqdn, string][] = await Promise.all(
    fqdns.map(async (fqdn) => [fqdn, await findZoneId(fqdn)]),
  );
  const obj = Object.fromEntries(entries);
  console.table(obj);
}
