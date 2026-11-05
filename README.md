# App Service Builder: Express sample

A standalone Express 5 web application for learning how to deploy GitHub source
with [Azure App Service Builder](https://builderapps.azure.com/docs/). It serves
HTML pages, JSON API endpoints, and a stylesheet from one Node.js process.
There is no compilation step, database, external service, or parent workspace
dependency.

**App Service Builder is in Private Preview. Use this sample for development
and testing, not as a production application template.** The original sample
was successfully deployed with the included manifest. The renamed repository
must still be deployed and verified in your authorized preview environment;
local tests do not establish cloud deployment success or regional availability.

## Features

- Server-rendered landing and product pages, including direct deep links.
- JSON health, availability, application identity, and request metadata routes.
- Separate HTML and JSON responses for missing pages and API routes.
- A root-level `builder.yaml` with an explicit startup and health contract.
- Automated HTTP tests using Node.js's built-in test runner.
- No frontend build or separately hosted API.

## Prerequisites

- [Node.js 24 LTS](https://nodejs.org/) and its bundled npm are recommended.
- [Git](https://git-scm.com/) and a GitHub account.
- For deployment: App Service Builder Private Preview access, an authorized
  Azure subscription, and an existing resource group in a supported preview
  location.
- Optional: [PowerShell 7](https://learn.microsoft.com/powershell/scripting/install/installing-powershell)
  for the endpoint verification script.

Express **5.1.0** is pinned. Keep `package-lock.json` and use `npm ci` to install
the locked dependency versions.

## Run locally

Fork
[AzureAppService/app-service-builder-express](https://github.com/AzureAppService/app-service-builder-express/fork)
to your GitHub account. Clone your fork, replacing `<your-github-account>`:

```sh
git clone https://github.com/<your-github-account>/app-service-builder-express.git
cd app-service-builder-express
npm ci --ignore-scripts
npm start
```

Open `http://localhost:8080/`. Expect the heading
`Express backend is running`. Follow the product link or open
`http://localhost:8080/products/widget-1` directly.

In another terminal:

```sh
curl -i http://localhost:8080/health
curl -i http://localhost:8080/api/version
```

Both should return HTTP 200 with JSON. Health includes `"status":"ok"` and
application identity includes `"app":"app-service-builder-express"`.

The server reads `PORT`, defaults to `8080`, and binds to `0.0.0.0`. Run it only
on a trusted development network and stop it with Ctrl+C. To use another port
in PowerShell:

```powershell
$env:PORT = "8081"
npm start
```

## Build and test

There is no build step. From the repository root, run:

```sh
node --check src/app.js
node --check src/server.js
npm test
```

Tests start their own loopback-only server on an available port and stop it
when finished. They check HTML pages, JSON endpoints, request-header filtering,
the stylesheet, and missing routes. GitHub Actions runs these checks on Linux
and Windows with Node.js 24.

With the application running, optionally check the local or deployed endpoint
using PowerShell 7:

```powershell
pwsh -NoProfile -File .\scripts\verify.ps1 -BaseUrl http://localhost:8080
```

For a deployed app, replace the base URL with the HTTPS runtime URL shown by
Builder Portal.

## Routes

| Route | Expected response |
|---|---|
| `/` | HTTP 200, HTML landing page and application details |
| `/products/widget-1` | HTTP 200, server-rendered product page |
| `/health` | HTTP 200, JSON health status and application identity |
| `/api/status` | HTTP 200, JSON availability status and timestamp |
| `/api/version` | HTTP 200, JSON application, Express, Node.js, and public deployment markers |
| `/api/request` | HTTP 200, JSON method, path, and selected request headers |
| `/assets/styles.v1.css` | HTTP 200, stylesheet with long-lived immutable caching |
| `/api/missing` | HTTP 404, JSON API error |
| `/missing-page` | HTTP 404, HTML not-found page |

`/api/request` returns only the host, user-agent, and forwarded-protocol headers;
it does not return authorization or cookie headers. The diagnostic routes are
public and unauthenticated.

## Deployment contract

The repository root contains `builder.yaml`:

```yaml
components:
  - name: web
    role: web
    platform: nodejs
    path: /
    run:
      port: 8080
      start: npm start
      healthCheckPath: /health
```

This declares one public Node.js web component at `/`. The source directory
defaults to the repository root. Builder installs the application dependencies
and runs `npm start`; Express serves both pages and assets. There is no `dist/`
output, static-site component, or development server to deploy.

The manifest intentionally leaves the supported Node.js version to Builder.
Keep this file at the repository root: the original deployment required it.

## Deploy your fork through Builder Portal

Follow the [Portal quickstart](https://builderapps.azure.com/docs/quickstarts/portal/)
for your authorized Private Preview environment:

1. Commit and push the sample to the `main` branch of your GitHub repository.
   Builder uses committed GitHub source, not local files.
2. Open Builder Portal and select your enabled subscription, existing resource
   group, and supported preview location.
3. Connect GitHub and authorize the Builder GitHub app to access your repository.
   Obtain organization-owner approval if required.
4. Create an app using your repository, branch `main`, and the repository root
   as its source directory. Do not select `src/` or `public/`.
5. Explicitly start deployment and wait for a successful terminal status.
   Connecting a source or pushing a commit is not proof of deployment.
6. Open the returned runtime URL. Verify `/`, `/products/widget-1`, `/health`,
   `/api/version`, and the stylesheet. Confirm missing routes return HTTP 404.

### Public deployment markers

The optional `DEPLOYMENT_MARKER`, `BUILD_MARKER`, and `RUNTIME_MARKER` environment
variables are displayed on HTML pages and returned by `/api/version`.
`DEPLOYMENT_MARKER` also appears in `/health`. They default to `local`.

All three are read by the running server, including `BUILD_MARKER`; none is
compiled into an artifact. Use them only for short, plain-text public demo
labels. **Never put credentials, connection strings, or private information in
these values.**

Configure them through Portal **Variables**, then deploy to apply them to the
running application. Saving a variable alone does not establish that the
current deployment changed. See the
[variables guide](https://builderapps.azure.com/docs/guides/variables/).

### Update and redeploy

Edit the application, run the tests, commit, and push to your fork's `main`
branch. Explicitly deploy through Builder Portal, wait for completion, and
verify the public endpoint again. Automatic deployment on push is not
qualified by this sample.

### Cleanup

Delete only the Builder app you created and wait for deletion to complete.
Do not delete a shared resource group, subscription, or unrelated resources.
Deleting the app does not delete your GitHub repository or local clone.

## Resources and contributions

- [App Service Builder documentation](https://builderapps.azure.com/docs/)
- [Sample catalog](https://builderapps.azure.com/docs/samples/)
- [Manifest guide](https://builderapps.azure.com/docs/guides/builder-yaml/)
- [Contributing](CONTRIBUTING.md)
- [Code of Conduct](.github/CODE_OF_CONDUCT.md)
- [Security reporting](SECURITY.md)
- [Changelog](CHANGELOG.md)
- [MIT license](LICENSE.md)
