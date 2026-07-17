# Architecture

## Stack
- **Next.js (App Router)** — full-stack: UI + API routes in one app (`apps/web`).
- **TypeScript**, strict mode, project references for incremental builds.
- **npm workspaces monorepo** — `apps/*` for deployable applications, `packages/*` for shared libraries.
- **Prisma** — database schema/client, shared via `@ramesh/database`.

## Why a monorepo instead of the flat frontend/backend split originally sketched
The original structure listed separate top-level `frontend/` and `backend/`
folders. Next.js merges those into one app (UI + API routes together), so a
literal `frontend/` + `backend/` split would fight the framework. Instead:

- `apps/web` — the Next.js app (UI *and* API routes live here)
- `packages/*` — framework-agnostic domain logic, imported by `apps/web`
  (and reusable later by a CLI, background worker, etc. without dragging
  Next.js along)

This keeps the *separation of concerns* from the original plan (design logic,
manufacturing logic, AI logic, and data access are still fully decoupled from
each other and from the UI) without fighting the chosen framework.

## Module boundaries
| Package | Responsibility |
|---|---|
| `packages/design-engine` | Parametric design generation (nameplates, boxes, nesting, SVG) |
| `packages/manufacturing-engine` | LightBurn export, laser cut params, machine profiles |
| `packages/ai-engine` | All Claude API calls (design assist, ad copy, etc.) |
| `packages/api-contracts` | Shared TS types between frontend and API routes |
| `packages/database` | Prisma schema + shared client |
| `apps/web` | UI (`src/app`, `src/components`, `src/modules`) + API routes (`src/app/api`) |

Each business feature (design studio, marketing, finance) becomes a folder
under `apps/web/src/modules/<name>/`, consuming one or more `packages/*`
engines rather than reimplementing logic in the UI layer.

## Conventions
- No `any` (enforced by ESLint).
- One module = one responsibility (SOLID).
- Shared/reusable UI → `src/components`; feature-specific UI → `src/modules/<feature>`.
- Cross-module types go in `@ramesh/api-contracts`, not duplicated per module.
