import { swallow } from "https://deno.land/x/fns@1.1.1/fn/swallow.ts";
import { s } from "https://deno.land/x/fns@1.1.1/string/s.ts";
import { Address, default as IPCIDR } from "npm:ip-cidr@4.0.0";

const INTERNAL_IP_RANGES: IPCIDR[] = [
  "10.0.0.0/8",
  "172.16.0.0/12",
  "192.168.0.0/16",
  "fc00::/7",
  "fe80::/10",
].map((s) => new IPCIDR(s));

export function isInternalIp(ip: Address | string): boolean {
  const address = typeof ip === "string" ? IPCIDR.createAddress(ip) : ip;
  return INTERNAL_IP_RANGES.some((range: IPCIDR) => range.contains(address));
}

const serveHandler: Deno.ServeHandler = async (
  req: Request,
  info: Deno.ServeHandlerInfo,
): Promise<Response> => {
  const { method, url } = req;
  const { remoteAddr } = info;
  const path = new URL(url).pathname;

  if (remoteAddr.transport !== "tcp") {
    throw new Error("Expected TCP transport");
  }

  if (!isInternalIp(remoteAddr.hostname)) {
    console.log(`${method} ${url} from ${remoteAddr.hostname}, forbidden.`);
    return new Response(
      "Forbidden",
      {
        status: 403,
        statusText: "Forbidden",
      },
    );
  }

  if (method.toUpperCase() !== "POST") {
    console.log(
      `${method} ${path} from ${remoteAddr.hostname}, method not allowed.`,
    );
    return new Response("Method Not Allowed", {
      status: 405,
      statusText: "Method Not Allowed",
    });
  }

  const body = await req.json();
  console.log(
    `${method} ${path} from ${remoteAddr.hostname}, body: ${
      s(body)
    }, isDefaultModeRequest: ${isDefaultModeRequest(body)}, isRawModeRequest: ${
      isRawModeRequest(body)
    }.`,
  );

  if (path === "/present") {
    if (!isValidRequest(body)) {
      console.log(
        `${method} ${path} from ${remoteAddr.hostname}, invalid request.`,
      );
      return new Response("Bad Request", {
        status: 400,
        statusText: "Bad Request",
      });
    }

    const domain: Domain = getDomainFromRequest(body);
    console.log(
      `${method} ${path} from ${remoteAddr.hostname}, domain: ${domain}.`,
    );

    const resolvedDomains: string[] = await resolveDomain(domain);
    console.log(
      `${method} ${path} from ${remoteAddr.hostname}, resolved domain: ${resolvedDomains}.`,
    );

    if (isDefaultModeRequest(req.body)) {
      console.log(
        `${method} ${path} from ${remoteAddr.hostname}, with a default mode request, allowed.`,
      );
    }
    console.log(`${method} ${path} from ${remoteAddr.hostname}, allowed.`);
  }
  return new Response("Not Found", { status: 404, statusText: "Not Found" });
};

export type Domain = `${string}.${string}`;
export type DefaultModeFqdn = `_acme-challenge.${Domain}.`;

export type DefaultModeRequest = {
  fqdn: DefaultModeFqdn;
  value: string;
};

export type RawModeRequest = {
  domain: Domain;
  token: string;
  keyAuth: string;
};

export type ValidRequest =
  | DefaultModeRequest
  | RawModeRequest;

export function isDomain(s: unknown): s is Domain {
  if (typeof s !== "string") {
    return false;
  }
  return /^[^.]+(\.[^.]+)+$/.test(s);
}

export function isDefaultModeFqdn(s: unknown): s is DefaultModeFqdn {
  if (typeof s !== "string") {
    return false;
  }
  return /^_acme-challenge\.[^.]+(\.[^.]+)+\.$/.test(s);
}

export function isDefaultModeRequest(
  o: unknown,
): o is DefaultModeRequest {
  if (typeof o !== "object") {
    console.log("not an object", o);
    return false;
  } else if (o === null) {
    console.log("null", o);
    return false;
  }
  const { fqdn, value } = o as Record<string, unknown>;
  if (!isDefaultModeFqdn(fqdn)) {
    console.log("not a default mode fqdn", fqdn);
    return false;
  }
  if (typeof value !== "string") {
    console.log("not a string", value);
    return false;
  }
  return true;
}

export function isRawModeRequest(
  o: unknown,
): o is RawModeRequest {
  if (typeof o !== "object" || o === null) {
    return false;
  }
  const { domain, token, keyAuth } = o as Record<string, unknown>;
  return isDomain(domain) && typeof token === "string" &&
    typeof keyAuth === "string";
}

export function isValidRequest(
  o: unknown,
): o is ValidRequest {
  return isDefaultModeRequest(o) || isRawModeRequest(o);
}

export function getDomainFromDefaultModeRequest(
  req: DefaultModeRequest,
): Domain {
  const domain = req.fqdn.slice("_acme-challenge.".length, -1);
  if (!isDomain(domain)) {
    throw new Error(`Invalid domain: ${domain}`);
  }
  return domain;
}

export function getDomainFromRawModeRequest(
  req: RawModeRequest,
): Domain {
  return req.domain;
}

export function getDomainFromRequest(
  req: ValidRequest,
): Domain {
  if (isDefaultModeRequest(req)) {
    return getDomainFromDefaultModeRequest(req);
  }
  return getDomainFromRawModeRequest(req);
}

export const RECORD_TYPES: Deno.RecordType[] = ["A", "AAAA", "CNAME", "ANAME"];

export type ResolveDnsResponse =
  | string[]
  | Deno.CAARecord[]
  | Deno.MXRecord[]
  | Deno.NAPTRRecord[]
  | Deno.SOARecord[]
  | Deno.SRVRecord[]
  | string[][];

export async function resolveDomain(domain: Domain): Promise<string[]> {
  const promises: Promise<ResolveDnsResponse>[] = RECORD_TYPES.map((type) =>
    Deno.resolveDns(domain, type).catch(swallow(Deno.errors.NotFound, []))
  );
  const resolved: ResolveDnsResponse[] = await Promise.all(promises);
  console.log(`Resolved ${domain}: ${s(resolved)}`);
  const records = [...new Set(resolved.flat(2) as string[])].sort();
  console.log(`Unique records for ${domain}: ${s(records)}`);
  const ips = records.filter(isValidIp);
  console.log(`IPs for ${domain}: ${s(ips)}`);
  const domains: Domain[] = records
    .filter(isNotValidIp)
    .filter(isDomain);
  console.log(`Domains for ${domain}: ${s(domains)}`);
  const resolvedDomains = (await Promise.all(domains.map(resolveDomain))).flat(
    2,
  );
  console.log(`Resolved domains for ${domain}: ${s(resolvedDomains)}`);
  console.log(`Returning ${s([...ips, ...resolvedDomains])} for ${domain}.`);
  return [...ips, ...resolvedDomains];
}

export function isValidIp(ip: string): boolean {
  return IPCIDR.isValidAddress(ip + "/32");
}

export function isNotValidIp(ip: string): boolean {
  return !isValidIp(ip);
}

// listen for http requests on port 10101
const httpServer: Deno.HttpServer<Deno.NetAddr> = Deno.serve(
  {
    hostname: "0.0.0.0",
    port: 10101,
    onListen({ port, hostname }) {
      console.log(`Server started at http://${hostname}:${port}`);
    },
  },
  serveHandler,
);

await httpServer.finished;
console.log("Server stopped.");
