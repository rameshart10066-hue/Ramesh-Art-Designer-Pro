# Auth Module — Database

## User model

Defined in `packages/database/prisma/schema.prisma`:

```prisma
model User {
  id           String   @id @default(cuid())
  email        String   @unique
  passwordHash String
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  @@map("users")
}
```

| Field | Type | Notes |
|---|---|---|
| `id` | `String` (cuid) | Primary key |
| `email` | `String` | Unique — enforced at the DB level, also checked in `registerUser` before insert |
| `passwordHash` | `String` | bcrypt hash, 12 salt rounds — plaintext password is never stored or logged |
| `createdAt` / `updatedAt` | `DateTime` | Standard audit timestamps |

Table name is `users` (via `@@map`) — lowercase/plural, consistent with
what other modules' future tables should follow.

## Setup

```bash
# .env.local
DATABASE_URL="postgresql://user:password@localhost:5432/ramesh_art_designer_pro"

npm run prisma:generate --workspace=@ramesh/database
npm run prisma:migrate --workspace=@ramesh/database
```

## Not yet built

- Password reset / email verification tokens (would need their own table)
- Role/permission fields on `User` (currently just id + email + password)
- Refresh tokens — sessions are single JWTs with a fixed 7-day expiry, no
  rotation or revocation list yet
