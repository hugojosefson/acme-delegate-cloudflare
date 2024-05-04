import { LISTEN_ADDRESS, LISTEN_PORT } from "./config.ts";
import { serveHandler } from "./serve-handler.ts";

export function createServer(): Deno.HttpServer<Deno.NetAddr> {
  return Deno.serve(
    {
      hostname: LISTEN_ADDRESS,
      port: LISTEN_PORT,
      onListen({ port, hostname }) {
        console.log(`Server started at http://${hostname}:${port}`);
      },
    },
    serveHandler,
  );
}
