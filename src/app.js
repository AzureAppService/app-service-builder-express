import express from "express";
import { fileURLToPath } from "node:url";
import packageJson from "../package.json" with { type: "json" };

const frameworkVersion = packageJson.dependencies.express;
const publicDirectory = fileURLToPath(new URL("../public", import.meta.url));

function deploymentInfo() {
  return {
    app: packageJson.name,
    version: packageJson.version,
    framework: `Express ${frameworkVersion}`,
    runtime: process.version,
    deploymentMarker: process.env.DEPLOYMENT_MARKER ?? "local",
    buildMarker: process.env.BUILD_MARKER ?? "local",
    runtimeMarker: process.env.RUNTIME_MARKER ?? "local"
  };
}

function page(title, content) {
  const info = deploymentInfo();

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>${title}</title>
    <link rel="stylesheet" href="/assets/styles.v1.css">
  </head>
  <body>
    <main>
      <p class="eyebrow">App Service Builder / Express</p>
      <h1>${title}</h1>
      ${content}
      <dl>
        <div><dt>Application</dt><dd>${info.app} ${info.version}</dd></div>
        <div><dt>Framework</dt><dd>${info.framework}</dd></div>
        <div><dt>Runtime</dt><dd>${info.runtime}</dd></div>
        <div><dt>Deployment</dt><dd>${info.deploymentMarker}</dd></div>
        <div><dt>Build setting</dt><dd>${info.buildMarker}</dd></div>
        <div><dt>Runtime setting</dt><dd>${info.runtimeMarker}</dd></div>
      </dl>
    </main>
  </body>
</html>`;
}

export function createApp() {
  const app = express();

  app.disable("x-powered-by");
  app.use("/assets", express.static(publicDirectory, {
    immutable: true,
    maxAge: "1y"
  }));

  app.get("/", (_request, response) => {
    response.type("html").send(page(
      "Express backend is running",
      '<p>The application started successfully and is serving HTTP traffic.</p><p><a href="/products/widget-1">Open the deep route</a></p>'
    ));
  });

  app.get("/products/widget-1", (_request, response) => {
    response.type("html").send(page(
      "Widget 1",
      '<p>This page proves that direct navigation to a server-rendered deep route works.</p><p><a href="/">Return home</a></p>'
    ));
  });

  app.get("/health", (_request, response) => {
    response.json({
      status: "ok",
      app: packageJson.name,
      deploymentMarker: process.env.DEPLOYMENT_MARKER ?? "local"
    });
  });

  app.get("/api/status", (_request, response) => {
    response.json({
      status: "available",
      timestamp: new Date().toISOString()
    });
  });

  app.get("/api/version", (_request, response) => {
    response.json(deploymentInfo());
  });

  app.get("/api/request", (request, response) => {
    response.json({
      method: request.method,
      path: request.path,
      headers: {
        host: request.get("host") ?? null,
        userAgent: request.get("user-agent") ?? null,
        forwardedProto: request.get("x-forwarded-proto") ?? null
      }
    });
  });

  app.use("/api", (_request, response) => {
    response.status(404).json({
      error: "not_found",
      message: "The requested API route does not exist."
    });
  });

  app.use((_request, response) => {
    response.status(404).type("html").send(page(
      "Page not found",
      '<p>The requested page does not exist.</p><p><a href="/">Return home</a></p>'
    ));
  });

  return app;
}
