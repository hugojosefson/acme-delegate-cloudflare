import { or } from "https://deno.land/x/fns@1.1.1/fn/or.ts";
import { isString } from "https://deno.land/x/fns@1.1.1/string/is-string.ts";
import { and } from "https://deno.land/x/fns@1.1.1/fn/and.ts";
import { TypeGuard } from "https://deno.land/x/fns@1.1.1/type-guard/type-guard.ts";
import IPCIDR from "npm:ip-cidr@4.0.0";
import { isIPv4, isIPv6 } from "npm:is-ip@5.0.1";

const INTERNAL_IP_RANGES: IPCIDR[] = [
  "10.0.0.0/8",
  "127.0.0.0/8",
  "172.16.0.0/12",
  "192.168.0.0/16",
  "fc00::/7",
  "fe80::/10",
].map((s) => new IPCIDR(s));

export type InternalIpAddressString = IpAddressString & {
  readonly __isInternalIpAddressString: unique symbol;
};

/**
 * Checks if an IP address is internal.
 *
 * @todo Use only as default, if ALLOWED_IP_RANGES is not defined.
 * @param ip
 */
export function isInternalIpAddressString(
  ip: unknown,
): ip is InternalIpAddressString {
  return isIpAddressString(ip) &&
    INTERNAL_IP_RANGES.some((range: IPCIDR) => range.contains(ip));
}

export type IpAddressString = IpV4AddressString | IpV6AddressString;

export type IpV4AddressString = `${number}.${number}.${number}.${number}` & {
  readonly __isIpV4AddressString: unique symbol;
};

export type IpV6AddressString = `${string}:${string}:${string}` & {
  readonly __isIpV6AddressString: unique symbol;
};

export const isIpV4AddressString: TypeGuard<IpV4AddressString> = and(
  isString,
  isIPv4,
) as TypeGuard<IpV4AddressString>;

export const isIpV6AddressString: TypeGuard<IpV6AddressString> = and(
  isString,
  isIPv6,
) as TypeGuard<IpV6AddressString>;

export const isIpAddressString: TypeGuard<IpAddressString> = or(
  isIpV4AddressString,
  isIpV6AddressString,
) as TypeGuard<IpAddressString>;
