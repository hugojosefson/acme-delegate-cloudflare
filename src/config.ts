import { always } from "https://deno.land/x/fns@1.1.1/fn/always.ts";
import { identity } from "https://deno.land/x/fns@1.1.1/fn/identity.ts";
import { isTripleEqual } from "https://deno.land/x/fns@1.1.1/fn/is-triple-equal.ts";
import { Predicate } from "https://deno.land/x/fns@1.1.1/fn/predicate.ts";
import { Transformer } from "https://deno.land/x/fns@1.1.1/fn/transformer.ts";
import { isString } from "https://deno.land/x/fns@1.1.1/string/is-string.ts";
import { s } from "https://deno.land/x/fns@1.1.1/string/s.ts";
import { TypeGuard } from "https://deno.land/x/fns@1.1.1/type-guard/type-guard.ts";
import { ClientOptions } from "npm:cloudflare@3.1.0";
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

console.log(`LISTEN_ADDRESS: ${LISTEN_ADDRESS}`);
console.log(`LISTEN_PORT:    ${LISTEN_PORT}`);
console.log(`HTTP_HOSTS:     ${s(HTTP_HOSTS)}`);
console.log(`ALLOW_DOMAINS:  ${s(ALLOW_DOMAINS)}`);

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

function getListFromEnv<R extends string, U extends R = R>(
  name: string,
  typeGuardToEnforce: TypeGuard<R> = isString as TypeGuard<R>,
  transformer: Transformer<R, U> = identity as Transformer<R, U>,
): U[] | undefined {
  const stringOrUndefined = Deno.env.get(name);
  if (stringOrUndefined === undefined) {
    return undefined;
  }
  return stringOrUndefined.split(",")
    .map((s) => s.trim())
    .filter((s) => s.length > 0)
    .map(createEnforceType(typeGuardToEnforce, `Invalid ${name}: ${s}`))
    .map(transformer);
}

function createEnforceType<T>(
  typeGuard: TypeGuard<T>,
  errorMessage: string,
): (x: unknown) => T | never {
  return function enforceType(x: unknown): T | never {
    if (typeGuard(x)) {
      return x;
    }
    throw new Error(errorMessage);
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
