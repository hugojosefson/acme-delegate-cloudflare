import { Domain, ensureDomain, ensureFQDomain, FQDomain } from "./domain.ts";

/**
 * Splits a {@link DefaultModeFqdn} into all possible domains.
 *
 * @example
 * ```ts
 * splitFqdn("_acme-challenge.local.hugojosefson.net.")
 * // => [
 * //   "_acme-challenge.local.hugojosefson.net.",
 * //   "local.hugojosefson.net.",
 * //   "hugojosefson.net.",
 * //   "net.",
 * // ]
 * ```
 * @param fqdn The fqdn.
 * @returns The possible domains.
 * @todo Stop at TLD, so we don't split further than necessary.
 */
export function splitFqdn(fqdn: Domain | FQDomain): FQDomain[] {
  const [_head, ...tail] = ensureDomain(fqdn).split(".");
  if (tail.length === 0) {
    return [ensureFQDomain(fqdn)];
  }
  return [
    ensureFQDomain(fqdn),
    ...splitFqdn(tail.join(".") as Domain),
  ];
}
