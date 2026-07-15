# Typing Level Zero

Typing Level Zero is a local-first touch typing practice tool built with
Vite, React, and TypeScript. Completed plays and analysis data are kept in the
browser with IndexedDB.

## Requirements

- Node.js 20.19 or later
- pnpm 11.1.1

Install dependencies from the repository root:

```sh
pnpm install
```

## Development

Start the Vite development server:

```sh
pnpm run dev
```

The application is served from the site root.

Build and preview the production bundle:

```sh
pnpm run build
pnpm run preview
```

The production bundle does not include a top-level `404.html`, so Cloudflare
Pages uses its default single-page application fallback for deep links.

## Checks

```sh
pnpm run format
pnpm run lint
pnpm run test:unit
pnpm run test:e2e
pnpm run test
```

Unit tests use Vitest with a jsdom environment. Playwright runs Chromium E2E
tests against a production preview server. Tests are expected under
`tests/unit` and `tests/e2e`.

## Deployment

Connect this repository to a Cloudflare Pages project with the following build
settings:

| Setting                | Value                     |
| ---------------------- | ------------------------- |
| Production branch      | `main`                    |
| Build command          | `pnpm run build`          |
| Build output directory | `dist`                    |
| Root directory         | Not set (repository root) |
| Environment variable   | `PNPM_VERSION=11.1.1`     |

Cloudflare Pages deploys updates to `main` to production and creates preview
deployments for other branches through its Git integration.
