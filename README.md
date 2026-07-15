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

The application is served under `/typing-level-zero/` to match its GitHub
Pages deployment path.

Build and preview the production bundle:

```sh
pnpm run build
pnpm run preview
```

The build copies `dist/index.html` to `dist/404.html`, allowing GitHub Pages
to fall back to the single-page application entry point for deep links.

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

The workflow in `.github/workflows/deploy.yml` builds and publishes the site to
GitHub Pages whenever `main` is updated. Enable GitHub Pages for the
repository with **GitHub Actions** as the deployment source.
