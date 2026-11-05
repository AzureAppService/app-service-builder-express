# Contributing to App Service Builder: Express sample

This project welcomes contributions and suggestions.

## Contributor License Agreement

Most contributions require a Contributor License Agreement (CLA) declaring
that you have the right to grant us the rights to use your contribution.
See [Microsoft Contributor License Agreements](https://cla.opensource.microsoft.com/).
Follow any CLA instructions shown on your pull request.

## Code of Conduct

This project follows the
[Microsoft Open Source Code of Conduct](.github/CODE_OF_CONDUCT.md).

## Issues and feature requests

Search [existing issues](https://github.com/AzureAppService/app-service-builder-express/issues)
before opening a new one. Include reproduction steps, expected and actual
behavior, Node.js/npm versions, operating system, and sanitized logs.
For larger changes, open an issue to discuss the proposal first.

Do not include credentials, private environment values, or other sensitive
information. For security concerns, follow [the security policy](SECURITY.md)
instead of opening a public issue.

## Development and pull requests

1. Fork the repository and create a branch for your change.
2. Install locked dependencies with `npm ci --ignore-scripts`.
3. Keep the sample standalone, small, and free of external service dependencies.
4. Add or update tests for behavior changes and update relevant documentation.
5. Run the checks below and describe the changes and results in your pull request.

```sh
node --check src/app.js
node --check src/server.js
npm test
```

For startup or routing changes, also run `npm start` and check the endpoints
listed in [the README](README.md). PowerShell 7 users can run:

```powershell
pwsh -NoProfile -File .\scripts\verify.ps1 -BaseUrl http://localhost:8080
```

Preserve the `/health` response and the startup contract in `builder.yaml`.
Local tests do not replace deployment verification when the manifest changes.
Do not commit `node_modules/`, environment files, credentials, or logs.
