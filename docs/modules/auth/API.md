# Auth Module — API Reference

All bodies/responses are typed in `packages/api-contracts/src/auth.ts`.

## POST /api/auth/register

Creates a user and logs them in (attaches a session cookie).

**Body**
```ts
{ email: string; password: string }
```

**Response — 201 Created**
```ts
{ success: true; user: { id: string; email: string } }
```

**Response — 422 Unprocessable Entity** (validation failure or duplicate email)
```ts
{ success: false; error: string }
```

## POST /api/auth/login

**Body**
```ts
{ email: string; password: string }
```

**Response — 200 OK**
```ts
{ success: true; user: { id: string; email: string } }
```

**Response — 401 Unauthorized**
```ts
{ success: false; error: "Invalid email or password." }
```
Note: this same message covers both "no such user" and "wrong password" —
distinguishing them would let a caller enumerate registered emails.

## POST /api/auth/logout

No body. Clears the session cookie.

**Response — 200 OK**
```ts
{ success: true }
```

## GET /api/auth/session

Returns the current session user, or null if not logged in.

**Response — 200 OK**
```ts
{ user: { id: string; email: string } | null }
```

## Session cookie

| | |
|---|---|
| Name | `ramesh_session` |
| Type | JWT (HS256), signed with `SESSION_SECRET` |
| Flags | `httpOnly`, `sameSite=lax`, `secure` in production |
| Lifetime | 7 days |

## Protected routes

`apps/web/src/middleware.ts` redirects unauthenticated requests to
`/login?redirectTo=<original path>`. Current matcher: `/dashboard/:path*`.
Add new protected prefixes to the `matcher` array as those modules land.
