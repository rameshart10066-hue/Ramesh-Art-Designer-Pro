# Ramesh Art Designer Pro

Business operations platform for the acrylic products business — unifying
laser-cut product design, manufacturing output, AI-assisted content, and
day-to-day business operations (marketing, finance) into a single system.

Built as a TypeScript monorepo on Next.js, with domain logic isolated into
independently testable packages rather than living inside UI code.

---

## Table of Contents

- [Features](#features)
- [Installation](#installation)
- [Folder Structure](#folder-structure)
- [Roadmap](#roadmap)
- [Contributing](#contributing)
- [License](#license)

---

## Features

### Available today
- **Monorepo scaffold** — npm workspaces, TypeScript project references, shared lint/format config across every package.
- **Next.js full-stack app** (`apps/web`) — UI and API routes in one deployable unit.
- **Health check API** — `GET /api/health` for uptime/monitoring checks.
- **Prisma-backed database layer** (`packages/database`) — single shared client, ready for schema definition.

### Migrating in
- **Design Engine** — parametric generation for nameplates, finger-joint boxes, and shape nesting, exporting LightBurn-ready SVGs (from the existing Acrylic Design Studio prototype).
- **AI Design Assistant** — plain-English → design generation via the Claude API.
- **Voice Command HUD** — Web Speech API-driven hands-free design controls.

### Planned
- **Manufacturing Engine** — kerf compensation, material/machine profiles, cut-time estimation.
- **Marketing module** — social content and ad copy generation.
- **Finance module** — invoicing and expense tracking.

See [Roadmap](#roadmap) for sequencing.

---

## Installation

**Prerequisites:** Node.js ≥ 20, npm, a PostgreSQL instance (local or hosted).

```bash
# 1. Clone and enter the project
git clone <repo-url> ramesh-art-designer-pro
cd ramesh-art-designer-pro

# 2. Install dependencies for every workspace package
npm install

# 3. Configure environment variables
cp .env.example .env.local
# then fill in DATABASE_URL and ANTHROPIC_API_KEY

# 4. (Once models exist in packages/database/prisma/schema.prisma)
npm run prisma:generate --workspace=@ramesh/database
npm run prisma:migrate --workspace=@ramesh/database

# 5. Start the dev server
npm run dev
# apps/web now running at http://localhost:3000
```

### Common scripts (run from repo root)

| Command | Description |
|---|---|
| `npm run dev` | Start the Next.js app in development mode |
| `npm run build` | Production build of all workspaces |
| `npm run typecheck` | TypeScript project-wide type check |
| `npm run lint` | ESLint across all workspaces |
| `npm run format` | Prettier write across the repo |

---

## Folder Structure

```
Ramesh-Art-Designer-Pro/
│
├── apps/
│   └── web/                       # Next.js full-stack app (UI + API routes)
│       ├── src/
│       │   ├── app/                # Routes and API endpoints (App Router)
│       │   ├── components/         # Shared, reusable UI components
│       │   ├── modules/            # Feature modules (design-studio, marketing, finance...)
│       │   ├── lib/                # Server-side helpers for API routes
│       │   ├── hooks/              # Shared React hooks
│       │   ├── services/           # Typed client-side API wrappers
│       │   └── types/              # App-local TypeScript types
│       └── public/                 # Static assets served as-is
│
├── packages/
│   ├── design-engine/              # Parametric design + SVG generation logic
│   ├── manufacturing-engine/       # LightBurn export, laser cut param logic
│   ├── ai-engine/                  # Claude API integration layer
│   ├── api-contracts/              # Shared frontend/backend TypeScript types
│   └── database/                   # Prisma schema, migrations, shared client
│
├── docs/                           # Architecture decision records, module specs
├── assets/                         # Shared static assets (fonts, icons, sample SVGs)
├── scripts/                        # Build/dev/deploy tooling — no business logic
├── .env.example                    # Environment variable template
├── package.json                    # Workspace root
└── README.md
```

Full rationale for this layout — including why `frontend/`/`backend/` collapsed
into `apps/web` under Next.js — is documented in
[`docs/ARCHITECTURE.md`](./docs/ARCHITECTURE.md).

---

## Roadmap

- [x] Monorepo scaffold (workspaces, TypeScript, lint/format, Prisma wiring)
- [ ] Migrate Acrylic Design Studio into `design-engine` + `apps/web/src/modules/design-studio`
- [ ] Define initial Prisma schema (products, orders, designs)
- [ ] AI Design Assistant module (`ai-engine` + design-studio UI)
- [ ] Manufacturing Engine (LightBurn export, machine profiles)
- [ ] Marketing module (social content, ad copy generation)
- [ ] Finance module (invoicing, expense tracking)
- [ ] Authentication & multi-user access
- [ ] Deployment pipeline (CI + hosting)

This list is sequenced but not fixed — module order can be reprioritized
based on business need.

---

## Contributing

This is currently a single-developer project (Karan), but is structured to
scale to a team workflow:

- **Branching** — feature branches off `main`, one feature/fix per branch.
- **Commits** — small, atomic, [Conventional Commits](https://www.conventionalcommits.org/) style (`feat:`, `fix:`, `chore:`, `docs:`, `refactor:`).
- **Code style** — TypeScript strict mode, no `any` (ESLint-enforced), SOLID principles, reusable components over one-off code.
- **Before committing** — run `npm run lint` and `npm run typecheck` from the repo root.
- **Architecture changes** — document reasoning in `docs/` (see `ARCHITECTURE.md` as the template) before restructuring folders.

---

## License

Proprietary — All rights reserved.

This codebase is private business software for the acrylic products business
and is not licensed for external use, distribution, or modification without
explicit permission from the owner.
