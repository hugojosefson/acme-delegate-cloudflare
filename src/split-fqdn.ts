import { not } from "https://deno.land/x/fns@1.1.1/fn/not.ts";
import { s } from "https://deno.land/x/fns@1.1.1/string/s.ts";
import { isRecordName, RecordName } from "./cloudflare-dns.ts";
import {
  Domain,
  ensureDomain,
  ensureFQDomain,
  FQDomain,
  isFQDomain,
} from "./domain.ts";

export type RecordNameFqdnPair = [RecordName, FQDomain];

export function isRecordNameFqdnPair(s: unknown): s is RecordNameFqdnPair {
  return Array.isArray(s) && s.length === 2 &&
    isRecordName(s[0]) && isFQDomain(s[1]);
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
 * @param fqdn The fqdn.
 * @returns The record names and domains.
 * @todo Stop at TLD, so we don't split further than necessary.
 */
export function splitFqdn(fqdn: Domain | FQDomain): RecordNameFqdnPair[] {
  const parts = ensureDomain(fqdn).split(".");
  if (parts.length < 2) {
    return [];
  }
  if (parts.some(not(isRecordName))) {
    throw new Error(
      `Invalid fqdn: ${fqdn}, because it contains a non-record name: ${
        s(parts)
      }`,
    );
  }
  const [recordName, ...rest] = parts as [RecordName, ...RecordName[]];
  if (rest.length === 0) {
    return [];
  }
  const thisPair = [
    recordName,
    ensureFQDomain(rest.join(".") as Domain),
  ] as RecordNameFqdnPair;
  const restSplit = splitFqdn(rest.join(".") as Domain);
  const restSplitWithThisPairsRecordNamePrepended = restSplit.map(
    (
      [restRecordName, restFqdn],
    ) => [recordName + "." + restRecordName, restFqdn] as RecordNameFqdnPair,
  );
  return [thisPair, ...restSplitWithThisPairsRecordNamePrepended];
}
