import { serveHandler } from "./serve-handler.ts";

export function createServer(): Deno.HttpServer<Deno.NetAddr> {
  return Deno.serve(
    {
      hostname: "0.0.0.0",
      port: 10101,
      onListen({ port, hostname }) {
        console.log(`Server started at http://${hostname}:${port}`);
      },
    },
    serveHandler,
  );
}
