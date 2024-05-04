import { ClientOptions } from "npm:cloudflare@3.1.0";

export const CF_CLIENT_OPTIONS: Partial<ClientOptions> = {
  apiEmail: Deno.env.get("CF_API_EMAIL"),
  apiKey: Deno.env.get("CF_API_KEY"),
  apiToken: Deno.env.get("CF_API_TOKEN"),
};

const HTTP_HOSTS = getListFromEnv("HTTP_HOSTS");
export const isAllowedHttpHost = createIsAllowedUnlessListIsUndefined(
  HTTP_HOSTS,
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

function getListFromEnv(name: string): string[] | undefined {
  const stringOrUndefined = Deno.env.get(name);
  if (stringOrUndefined === undefined) {
    return undefined;
  }
  return stringOrUndefined.split(",").map((s) => s.trim()).filter((s) =>
    s.length > 0
  );
}

function createIsAllowedUnlessListIsUndefined<T>(
  list: T[] | undefined,
): (s: T) => boolean {
  return function (item: T): boolean {
    if (list === undefined) {
      return true;
    }
    return list.includes(item);
  };
}
