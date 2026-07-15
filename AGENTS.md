# Typing Level Zero Agent Guide

## Repository Purpose

This repository contains a static, local-first touch typing application. The
application uses React and Vite, stores completed plays in IndexedDB, and is
deployed as a static bundle to Cloudflare Pages.

Keep the application client-side and generic. Do not add accounts, server-side
storage, external APIs, or framework-specific runtime services without an
explicit requirement.

## Tooling

- Package manager: pnpm only. Do not use npm or yarn.
- Runtime target: browser ESM with a Bun-compatible TypeScript toolchain.
- Module system: ESM with `"type": "module"`.
- TypeScript is configured as strict and `noEmit`.
- Application: React and Vite.
- Routing: React Router from the Cloudflare Pages site root.
- Formatting: oxfmt.
- Linting and type checking: Oxlint, with ESLint for TypeScript naming rules.
- Unit tests: Vitest and Testing Library under `tests/unit`.
- E2E tests: Playwright under `tests/e2e`.
- Git hooks are configured automatically during `postinstall`.

## Common Commands

Run all commands from the repository root.

| Task                      | Command              |
| ------------------------- | -------------------- |
| Install dependencies      | `pnpm install`       |
| Start development         | `pnpm run dev`       |
| Build production assets   | `pnpm run build`     |
| Preview production assets | `pnpm run preview`   |
| Format                    | `pnpm run format`    |
| Autofix                   | `pnpm run fix`       |
| Lint and type check       | `pnpm run lint`      |
| Unit tests                | `pnpm run test:unit` |
| E2E tests                 | `pnpm run test:e2e`  |
| All tests                 | `pnpm run test`      |

## Editing Rules

- Keep source code, comments, commit messages, and repository documentation in
  English.
- Preserve pnpm workspace catalog usage when updating dependencies.
- Keep the Cloudflare Pages root base path and default SPA fallback intact
  unless the deployment strategy changes deliberately.
- Prefer small, direct changes over new abstractions.
- Keep application data local to the browser unless the requirements change.

## Validation

Before completing repository changes, run the relevant format, lint, test, and
build checks:

```sh
pnpm run format
pnpm run lint
pnpm run test:unit
pnpm run test:e2e
pnpm run build
```

If a check cannot run, report the reason and the unverified scope explicitly.
