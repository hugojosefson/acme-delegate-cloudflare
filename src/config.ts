import { ClientOptions } from "npm:cloudflare@3.1.0";

export const CF_CLIENT_OPTIONS: Partial<ClientOptions> = {
  apiEmail: Deno.env.get("CF_API_EMAIL"),
  apiKey: Deno.env.get("CF_API_KEY"),
  apiToken: Deno.env.get("CF_API_TOKEN"),
};

export const HTTP_HOSTS: undefined | string[] = Deno.env.get(
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
