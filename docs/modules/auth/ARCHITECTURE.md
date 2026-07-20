# Auth Module — Architecture

## Why `lib/auth/` is split into four files instead of one

| File | Runtime | Depends on |
|---|---|---|
| `password.ts` | Node only | `bcryptjs` |
| `session.ts` | Edge-safe | `jose` (Web Crypto, not Node `crypto`) |
| `credentials.ts` | Node only | `password.ts`, `@ramesh/database` |
| `cookies.ts` | Node (Route Handlers) | `session.ts`, `next/headers` |

`middleware.ts` runs on Next.js's Edge runtime, which doesn't have Node's
`crypto` module or a database driver. It imports **only** `session.ts`. If
session verification lived in the same file as password hashing or the
Prisma client, importing it from middleware would break the build. This
split is a hard runtime boundary, not just a style preference.

## Layering

```
Route Handler (route.ts)          <- thin HTTP adapter: parse request, call lib, map to status
        |
lib/auth/{credentials,cookies}.ts <- business logic: validation, DB access, cookie attach/clear
        |
lib/auth/{password,session}.ts    <- primitives: hashing, JWT sign/verify
        |
@ramesh/database (db.user)        <- persistence
```

Each route handler (`login`, `register`, `logout`, `session`) does nothing
but: parse the body, call one `lib/auth` function, map the result to an
HTTP status. All actual logic — validation, generic error messages,
cookie attachment — lives in `lib/auth`, so it's testable without spinning
up a Next.js server (see the Vitest suite in `lib/auth/__tests__/`).

## Security decisions

- **Generic "Invalid email or password"** for both unknown-email and
  wrong-password cases — prevents user enumeration.
- **httpOnly, sameSite=lax cookie** — not readable by client JS, mitigates
  XSS token theft; `lax` blocks cross-site POST but allows top-level
  navigation (so a login redirect still works).
- **bcrypt with 12 salt rounds** for password hashing (`password.ts`).
- **7-day session expiry**, enforced by the JWT's own `exp` claim (`jose`
  rejects expired tokens at verify time — no manual expiry check needed).

## Client-side shape

`LoginForm` and `RegisterForm` share `CredentialsFields` (the email/password
inputs) rather than duplicating markup. Each form otherwise owns its own
submit handling and error state, and stays agnostic of routing — the
`onSuccess` callback is supplied by the page (`/login`, `/register`), which
is what actually calls `router.push()`. This keeps the forms reusable
outside of a full-page context (e.g. a future "sign in to continue" modal).

## Known limitation

There is no `packages/database` migration applied yet in this sandbox —
Prisma's client generator needs to reach `binaries.prisma.sh`, which isn't
in this environment's network allowlist. The `User` model is written and
correct; run `npm run prisma:generate --workspace=@ramesh/database` on a
machine with normal internet access before using this against a real
database. Tests mock `@ramesh/database` and don't depend on this.
