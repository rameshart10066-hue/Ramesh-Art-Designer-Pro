# Auth Module — Examples

## curl

```bash
# Register
curl -i -c cookies.txt -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"karan@example.com","password":"correct-horse-battery"}'

# Login (reuses the cookie jar so the session cookie is captured)
curl -i -c cookies.txt -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"karan@example.com","password":"correct-horse-battery"}'

# Check current session (sends the saved cookie)
curl -i -b cookies.txt http://localhost:3000/api/auth/session

# Logout
curl -i -b cookies.txt -X POST http://localhost:3000/api/auth/logout
```

## React — using the forms directly

```tsx
import { LoginForm } from "@/modules/auth";
import { useRouter } from "next/navigation";

function CustomLoginModal() {
  const router = useRouter();
  return <LoginForm onSuccess={(userId) => router.push("/dashboard")} />;
}
```

## Server — reading the session in a Server Component

```tsx
import { getSession } from "@/lib/auth";

export default async function AccountPage() {
  const user = await getSession();
  if (!user) return <p>Not signed in.</p>;
  return <p>Signed in as {user.email}</p>;
}
```

## Server — issuing credentials programmatically (e.g. a seed script)

```ts
import { registerUser } from "@/lib/auth";

const result = await registerUser({ email: "seed@example.com", password: "temporary-password" });
if (!result.success) throw new Error(result.error);
console.log("Created user:", result.user.id);
```
