# Ramesh Art Designer Pro

Business operations platform for the acrylic products business — design,
manufacturing, AI assistance, marketing, and finance in one system.

See [`docs/ARCHITECTURE.md`](./docs/ARCHITECTURE.md) for the full structure
and module boundaries.

## Structure

```
apps/web/              Next.js full-stack app (UI + API routes)
packages/design-engine/         Parametric design generation
packages/manufacturing-engine/  LightBurn export, laser cut logic
packages/ai-engine/             Claude API integration
packages/api-contracts/         Shared frontend/backend types
packages/database/              Prisma schema + client
docs/                   Architecture decision records, specs
assets/                 Shared static assets
scripts/                Build/dev tooling
```

## Setup

```bash
npm install
cp .env.example .env.local   # then fill in DATABASE_URL, ANTHROPIC_API_KEY
npm run dev                  # starts apps/web on localhost:3000
```

## Status

Scaffold only — no feature modules built yet. Next step: pick the first
module (design studio migration, marketing/ad copy, or finance/invoicing)
and build it inside `apps/web/src/modules/`.
