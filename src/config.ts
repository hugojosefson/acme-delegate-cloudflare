import { always } from "https://deno.land/x/fns@1.1.1/fn/always.ts";
import { and } from "https://deno.land/x/fns@1.1.1/fn/and.ts";
import { identity } from "https://deno.land/x/fns@1.1.1/fn/identity.ts";
import { isTripleEqual } from "https://deno.land/x/fns@1.1.1/fn/is-triple-equal.ts";
import { Predicate } from "https://deno.land/x/fns@1.1.1/fn/predicate.ts";
import { Transformer } from "https://deno.land/x/fns@1.1.1/fn/transformer.ts";
import { isString } from "https://deno.land/x/fns@1.1.1/string/is-string.ts";
import { s } from "https://deno.land/x/fns@1.1.1/string/s.ts";
import { TypeGuard } from "https://deno.land/x/fns@1.1.1/type-guard/type-guard.ts";
import { ClientOptions } from "npm:cloudflare@3.1.0";
import IPCIDR from "npm:ip-cidr@4.0.0";
import { ensureFQDomain, FQDomain, isDomainOrFQDomain } from "./domain.ts";

export const CF_CLIENT_OPTIONS: Partial<ClientOptions> = {
  apiEmail: Deno.env.get("CF_API_EMAIL"),
  apiKey: Deno.env.get("CF_API_KEY"),
  apiToken: Deno.env.get("CF_API_TOKEN"),
};

const HTTP_HOSTS = getListFromEnv("HTTP_HOSTS");
export const isAllowedHttpHost = createIsAllowedUnlessListIsUndefined(
  HTTP_HOSTS,
);

const ALLOW_DOMAINS = getListFromEnv(
  "ALLOW_DOMAINS",
  isDomainOrFQDomain,
  ensureFQDomain,
);

export const isAllowedDomain = createIsAllowedUnlessListIsUndefined(
  ALLOW_DOMAINS,
  function createAllowDomainPredicate(
    domainToCheck: unknown,
  ): Predicate<FQDomain> {
    return function allowDomainPredicate(allowedFQDomain: FQDomain) {
      return isDomainOrFQDomain(domainToCheck) &&
        (
          ensureFQDomain(domainToCheck) === allowedFQDomain ||
          ensureFQDomain(domainToCheck).endsWith(`.${allowedFQDomain}`)
        );
    };
  },
);

const KNOWN_INTERNAL_IP_RANGES: string[] = [
  "10.0.0.0/8",
  "172.16.0.0/12",
  "192.168.0.0/16",
];

export const ALLOW_IP_RANGES: IPCIDR[] | undefined = getListFromEnv(
  "ALLOW_IP_RANGES",
  and(isString, IPCIDR.isValidCIDR.bind(IPCIDR)) as TypeGuard<string>,
  (cidr) => new IPCIDR(cidr),
  KNOWN_INTERNAL_IP_RANGES,
);

export const isAllowedIp = createIsAllowedUnlessListIsUndefined(
  ALLOW_IP_RANGES,
  function createAllowIpRangePredicate(
    ipToCheck: unknown,
  ): Predicate<IPCIDR> {
    return function allowIpRangePredicate(allowedIpRange: IPCIDR) {
      return isString(ipToCheck) &&
        allowedIpRange.contains(ipToCheck as string);
    };
  },
);

const LISTEN_ADDRESS_DEFAULT = "0.0.0.0";
const LISTEN_PORT_DEFAULT = 80;

export const LISTEN_ADDRESS: string = getStringFromEnv(
  "LISTEN_ADDRESS",
  LISTEN_ADDRESS_DEFAULT,
);

export const LISTEN_PORT: number = getNumberFromEnv(
  "LISTEN_PORT",
  LISTEN_PORT_DEFAULT,
);

console.log(`LISTEN_ADDRESS:  ${LISTEN_ADDRESS}`);
console.log(`LISTEN_PORT:     ${LISTEN_PORT}`);
console.log(`HTTP_HOSTS:      ${s(HTTP_HOSTS)}`);
console.log(`ALLOW_DOMAINS:   ${s(ALLOW_DOMAINS)}`);
console.log(
  `ALLOW_IP_RANGES: ${
    ALLOW_IP_RANGES === undefined ? "undefined" : ALLOW_IP_RANGES
  }`,
);

function getStringFromEnv(name: string, defaultValue: string): string {
  const stringOrUndefined = Deno.env.get(name);
  if (stringOrUndefined === undefined) {
    return defaultValue;
  }
  return stringOrUndefined;
}

function getNumberFromEnv(name: string, defaultValue: number): number {
  const stringOrUndefined = Deno.env.get(name);
  if (stringOrUndefined === undefined) {
    return defaultValue;
  }
  const number = parseInt(stringOrUndefined, 10);
  if (isNaN(number)) {
    throw new Error(`Invalid ${name}: ${number}`);
  }
  return number;
}

function getListFromEnv<R extends string, U = R>(
  name: string,
  typeGuardToEnforce: TypeGuard<R> = isString as TypeGuard<R>,
  transformer: Transformer<R, U> = identity as Transformer<R, U>,
  defaultSourceIfUndefined?: R[] | string,
): U[] | undefined {
  const stringOrUndefined = Deno.env.get(name);
  if (
    stringOrUndefined === undefined && defaultSourceIfUndefined === undefined
  ) {
    return undefined;
  }

  const defaultArray = isString(defaultSourceIfUndefined)
    ? defaultSourceIfUndefined.split(",")
    : defaultSourceIfUndefined;
  const array = stringOrUndefined === undefined
    ? defaultArray
    : stringOrUndefined.split(",");
  if (array === undefined) {
    return undefined;
  }
  return array
    .map((s) => s.trim())
    .filter((s) => s.length > 0)
    .map(
      createEnforceType(typeGuardToEnforce, (x) => `Invalid ${name}: ${s(x)}`),
    )
    .map(transformer);
}

function createEnforceType<T>(
  typeGuard: TypeGuard<T>,
  createErrorMessage: Transformer<unknown, string>,
): (x: unknown) => T | never {
  return function enforceType(x: unknown): T | never {
    if (typeGuard(x)) {
      return x;
    }
    throw new Error(createErrorMessage(x));
  };
}

function createIsAllowedUnlessListIsUndefined<
  AllowedItem,
  ItemToCheck,
  CreateAllowPredicate
    extends ((itemToCheck: ItemToCheck) => Predicate<AllowedItem>),
>(
  list: AllowedItem[] | undefined,
  createAllowPredicate: CreateAllowPredicate =
    isTripleEqual as unknown as CreateAllowPredicate,
): Predicate<ItemToCheck> {
  if (list === undefined) {
    return always(true);
  }
  return function checkItem(itemToCheck: ItemToCheck): boolean {
    const allowPredicate: Predicate<AllowedItem> = createAllowPredicate(
      itemToCheck,
    );
    return list.some(allowPredicate);
  };
}
