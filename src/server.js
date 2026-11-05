import { createServer } from "node:http";
import { createApp } from "./app.js";

const port = Number.parseInt(process.env.PORT ?? "8080", 10);

if (!Number.isInteger(port) || port < 1 || port > 65535) {
  throw new Error(`PORT must be an integer between 1 and 65535; received "${process.env.PORT}".`);
}

const server = createServer(createApp());

server.listen(port, "0.0.0.0", () => {
  console.log(`app-service-builder-express listening on port ${port}`);
});

function shutdown(signal) {
  console.log(`${signal} received; shutting down`);
  server.close((error) => {
    if (error) {
      console.error("Failed to close the HTTP server", error);
      process.exitCode = 1;
      return;
    }

    process.exitCode = 0;
  });
}

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));
