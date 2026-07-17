"use client";

import { useRouter } from "next/navigation";
import { RegisterForm } from "@/modules/auth";

export default function RegisterPage() {
  const router = useRouter();

  return (
    <main>
      <h1>Create an account</h1>
      <RegisterForm onSuccess={() => router.push("/dashboard")} />
    </main>
  );
}
