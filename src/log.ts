import { s } from "https://deno.land/x/fns@1.1.1/string/s.ts";
import { getFQDomainFromRequest } from "./get-domain-from-request.ts";
import { isDefaultModeRequest, isRawModeRequest } from "./request.ts";

export function log<T extends Response>(
  req: Request,
  info: Deno.ServeHandlerInfo,
  response: T,
  parenthesis?: string,
): T {
  const { remoteAddr } = info;
  const { method, url } = req;
  const path = new URL(url).pathname;

  console.log(
    `${method} ${path} from ${remoteAddr.hostname} → ${response.status} ${response.statusText}` +
      (parenthesis ? ` (${parenthesis})` : ""),
  );
  return response;
}

export async function logWithBody<T extends Response>(
  req: Request,
  info: Deno.ServeHandlerInfo,
  response: T,
  parenthesis?: string,
): Promise<T> {
  const body = await req.json();
  const isADefaultModeRequest = isDefaultModeRequest(body);
  const isARawModeRequest = isRawModeRequest(body);
  return log(
    req,
    info,
    response,
    [
      parenthesis,
      s(body),
      `isDefaultModeRequest: ${isADefaultModeRequest}`,
      `isRawModeRequest: ${isARawModeRequest}`,
      (isADefaultModeRequest || isARawModeRequest)
        ? `domain: ${getFQDomainFromRequest(body)}`
        : "",
    ].filter(Boolean).join(", "),
  );
}
