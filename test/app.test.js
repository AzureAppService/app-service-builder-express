import assert from "node:assert/strict";
import { createServer } from "node:http";
import { after, before, test } from "node:test";
import { runInNewContext } from "node:vm";
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

test("root actions keep health inline and customization local", async () => {
  const html = await fetch(`${baseUrl}/`).then((response) => response.text());
  assert.match(html, /<button[^>]+data-health-app="app-service-builder-express">Check app health/);
  assert.match(html, /role="status"/);
  assert.match(html, /<summary>Customize this sample<\/summary>/);
  assert.match(html, /In your fork/);
  assert.match(html, /href="https:\/\/expressjs.com\/">Express documentation/);
  assert.match(html, /href="https:\/\/nodejs.org\/en\/docs">Node.js documentation/);
  assert.match(html, /href="https:\/\/builder.appservice.azure.com\/docs\/">App Service Builder documentation/);
  for (const asset of ["/assets/styles.v2.css", "/assets/health.v1.js", "/assets/brand/family.v1.css", "/assets/brand/builder.svg", "/assets/brand/nodejs.svg"]) {
    assert.ok(html.includes(asset));
    const response = await fetch(`${baseUrl}${asset}`);
    assert.equal(response.status, 200);
    assert.ok((await response.arrayBuffer()).byteLength > 0);
  }
});

test("inline health verifies the app and recovers from failure", async () => {
  const script = await fetch(`${baseUrl}/assets/health.v1.js`).then((response) => response.text());
  for (const [response, expected] of [
    [new Response('{"status":"ok","app":"app-service-builder-express"}'), /responded successfully/],
    [new Response('{"status":"ok","app":"another-app"}'), /check failed/],
    [new Response("Unavailable", { status: 503 }), /check failed/],
    [new Response("not JSON"), /check failed/],
  ]) {
    let click;
    const button = {
      dataset: { healthApp: "app-service-builder-express" },
      addEventListener: (_event, callback) => { click = callback; },
    };
    const result = { textContent: "" };
    runInNewContext(script, {
      document: { querySelector: (selector) => selector === '[data-health-app]' ? button : result },
      AbortSignal,
      fetch: async (url, options) => {
        assert.equal(url, "/health");
        assert.equal(options.cache, "no-store");
        return response;
      },
    });
    const pending = click();
    assert.equal(button.disabled, true);
    await pending;
    assert.equal(button.disabled, false);
    assert.match(result.textContent, expected);
  }
});

test("revalidates the editable family stylesheet after redeployment", async () => {
  const stylesheet = await fetch(`${baseUrl}/assets/brand/family.v1.css`);
  assert.equal(stylesheet.status, 200);
  assert.match(stylesheet.headers.get("content-type"), /text\/css/);
  assert.equal(stylesheet.headers.get("cache-control"), "public, max-age=0, must-revalidate");
  assert.ok(stylesheet.headers.get("etag"));
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
