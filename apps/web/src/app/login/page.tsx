"use client";

import { useRouter } from "next/navigation";
import { LoginForm } from "@/modules/auth";

/**
 * /login route. Stays thin: routing/redirect concerns live here, form
 * logic and validation live in LoginForm so the form itself can be reused
 * elsewhere (e.g. a "sign in to continue" modal) without pulling in
 * Next.js router.
 */
export default function LoginPage() {
  const router = useRouter();

  return (
    <main>
      <h1>Sign in</h1>
      <LoginForm onSuccess={() => router.push("/")} />
    </main>
  );
}
