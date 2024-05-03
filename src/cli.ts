import { createServer } from "./create-server.ts";

const httpServer: Deno.HttpServer<Deno.NetAddr> = createServer();
await httpServer.finished;
console.log("Server stopped.");
