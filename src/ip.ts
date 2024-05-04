import { or } from "https://deno.land/x/fns@1.1.1/fn/or.ts";
import { isString } from "https://deno.land/x/fns@1.1.1/string/is-string.ts";
import { and } from "https://deno.land/x/fns@1.1.1/fn/and.ts";
import { TypeGuard } from "https://deno.land/x/fns@1.1.1/type-guard/type-guard.ts";
import { isIPv4, isIPv6 } from "npm:is-ip@5.0.1";

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
