# AI Vacation Planner (polyglot monorepo)

A portfolio app that turns natural-language travel requests into structured, validated vacation recommendations. Its main goal is to show that the system is backend-swappable: the web client talks only to an HTTP contract, so a TypeScript, Python (FastAPI) or Go backend can serve it without any frontend change. Portability is proven by the contract test suite, not by intent.

## Prerequisites

- Node 24.22.1 (pinned in `.nvmrc`)
- pnpm 12.15.0, provided through corepack (`corepack enable`)

## Commands

```sh
pnpm install
pnpm typecheck
pnpm lint
pnpm format:check
```

Use pnpm only; do not use npm or Yarn.

## Documentation

- [CLAUDE.md](CLAUDE.md): architecture, testing strategy and engineering rules
- [docs/work-breakdown.md](docs/work-breakdown.md): build order and progress
