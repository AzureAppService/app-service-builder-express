import assert from "node:assert/strict";
import { createServer } from "node:http";
import { after, before, test } from "node:test";
import { createApp } from "../src/app.js";

let baseUrl;
let server;

before(async () => {
  server = createServer(createApp());
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));

  const address = server.address();
  baseUrl = `http://127.0.0.1:${address.port}`;
});

after(async () => {
  await new Promise((resolve, reject) => {
    server.close((error) => error ? reject(error) : resolve());
  });
});

test("serves the landing page and deep route", async () => {
  const home = await fetch(`${baseUrl}/`);
  const deepRoute = await fetch(`${baseUrl}/products/widget-1`);

  assert.equal(home.status, 200);
  assert.match(home.headers.get("content-type"), /text\/html/);
  assert.match(await home.text(), /Express backend is running/);
  assert.equal(deepRoute.status, 200);
  assert.match(await deepRoute.text(), /Widget 1/);
});

test("reports health and deployment identity", async () => {
  const health = await fetch(`${baseUrl}/health`).then((response) => response.json());
  const version = await fetch(`${baseUrl}/api/version`).then((response) => response.json());

  assert.equal(health.status, "ok");
  assert.equal(health.app, "app-service-builder-express");
  assert.equal(version.app, "app-service-builder-express");
  assert.match(version.framework, /^Express /);
  assert.match(version.runtime, /^v\d+/);
});

test("reports API availability and serves the stylesheet", async () => {
  const status = await fetch(`${baseUrl}/api/status`);
  const stylesheet = await fetch(`${baseUrl}/assets/styles.v1.css`);

  assert.equal(status.status, 200);
  assert.match(status.headers.get("content-type"), /application\/json/);
  const body = await status.json();
  assert.equal(body.status, "available");
  assert.ok(Number.isFinite(Date.parse(body.timestamp)));

  assert.equal(stylesheet.status, 200);
  assert.match(stylesheet.headers.get("content-type"), /text\/css/);
  assert.match(stylesheet.headers.get("cache-control"), /immutable/);
  assert.match(await stylesheet.text(), /:root/);
});

test("returns safe request metadata", async () => {
  const response = await fetch(`${baseUrl}/api/request`, {
    headers: {
      "user-agent": "builder-app-shape-test",
      authorization: "Bearer must-not-be-returned"
    }
  });
  const body = await response.json();

  assert.equal(body.method, "GET");
  assert.equal(body.path, "/api/request");
  assert.equal(body.headers.userAgent, "builder-app-shape-test");
  assert.equal("authorization" in body.headers, false);
});

test("distinguishes page and API misses", async () => {
  const page = await fetch(`${baseUrl}/missing-page`);
  const api = await fetch(`${baseUrl}/api/missing`);

  assert.equal(page.status, 404);
  assert.match(await page.text(), /Page not found/);
  assert.equal(api.status, 404);
  assert.deepEqual(await api.json(), {
    error: "not_found",
    message: "The requested API route does not exist."
  });
});
