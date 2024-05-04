import { ClientOptions } from "npm:cloudflare@3.1.0";

export const CF_CLIENT_OPTIONS: Partial<ClientOptions> = {
  apiEmail: Deno.env.get("CF_API_EMAIL"),
  apiKey: Deno.env.get("CF_API_KEY"),
  apiToken: Deno.env.get("CF_API_TOKEN"),
};

const HTTP_HOSTS: undefined | string[] = Deno.env.get(
  "HTTP_HOSTS",
)
  ?.split(",")
  .map((s) => s.trim())
  .filter((s) => s.length > 0);

export function isAllowedHttpHost(s: string): boolean {
  if (HTTP_HOSTS === undefined) {
    return true;
  }
  return HTTP_HOSTS.includes(s);
}

const LISTEN_ADDRESS_DEFAULT = "0.0.0.0";
const LISTEN_PORT_DEFAULT = "80";

export const LISTEN_ADDRESS: string = Deno.env.get("LISTEN_ADDRESS") ??
  LISTEN_ADDRESS_DEFAULT;

export const LISTEN_PORT: number = getListenPort();

function getListenPort(): number {
  const stringOrUndefined = Deno.env.get("LISTEN_PORT");
  const number = parseInt(
    stringOrUndefined ?? LISTEN_PORT_DEFAULT,
    10,
  );
  if (isNaN(number)) {
    throw new Error(`Invalid LISTEN_PORT: ${number}`);
  }
  return number;
}
