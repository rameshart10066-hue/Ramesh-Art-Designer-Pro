# Auth Module

Email/password authentication with httpOnly-cookie sessions (JWT), for the
`feature/auth` branch of Ramesh Art Designer Pro.

## What's included

- Registration and login with bcrypt password hashing
- Session issuance via a signed JWT stored in an httpOnly cookie
- Route protection middleware for authenticated-only pages
- Registration/login forms sharing a common field component

## Folder map

```
packages/database/prisma/schema.prisma   User model
packages/api-contracts/src/auth.ts       LoginRequest/RegisterRequest/AuthResponse/SessionUser

apps/web/src/lib/auth/
  password.ts        bcrypt hash/verify (Node-only)
  session.ts          JWT sign/verify (Edge-safe, jose)
  credentials.ts       DB-backed register/login logic
  cookies.ts           httpOnly cookie read/write helpers
  index.ts             barrel export

apps/web/src/app/api/auth/
  login/route.ts
  register/route.ts
  logout/route.ts
  session/route.ts

apps/web/src/middleware.ts    route protection (matcher: /dashboard/:path*)

apps/web/src/services/authService.ts     client wrapper

apps/web/src/modules/auth/
  components/LoginForm.tsx
  components/RegisterForm.tsx
  components/CredentialsFields.tsx   shared email/password inputs
  index.ts

apps/web/src/app/login/page.tsx
apps/web/src/app/register/page.tsx
```

## Related docs

- [API.md](./API.md) — endpoint reference
- [FLOW.md](./FLOW.md) — sequence diagrams
- [ARCHITECTURE.md](./ARCHITECTURE.md) — layering and design decisions
- [DATABASE.md](./DATABASE.md) — User model
- [EXAMPLES.md](./EXAMPLES.md) — curl and React usage examples
