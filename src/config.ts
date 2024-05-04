import { ClientOptions } from "npm:cloudflare@3.1.0";

export const CF_CLIENT_OPTIONS: Partial<ClientOptions> = {
  apiEmail: Deno.env.get("CF_API_EMAIL"),
  apiKey: Deno.env.get("CF_API_KEY"),
  apiToken: Deno.env.get("CF_API_TOKEN"),
};
