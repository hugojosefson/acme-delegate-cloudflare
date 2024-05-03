import statuses from "npm:statuses@2.0.1";

export function respond(
  status: number,
  body = statuses(status),
  headers?: Headers,
): Response {
  return new Response(body, {
    status,
    statusText: statuses(status),
    headers,
  });
}
