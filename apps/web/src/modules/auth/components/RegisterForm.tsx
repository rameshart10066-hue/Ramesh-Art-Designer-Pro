"use client";

import { useState, type FormEvent } from "react";
import { register } from "@/services/authService";
import { CredentialsFields } from "./CredentialsFields";

interface RegisterFormProps {
  /** Called after a successful registration (the user is auto-logged-in). */
  onSuccess?: (userId: string) => void;
}

/**
 * Registration form. Mirrors LoginForm's shape deliberately — same
 * onSuccess contract, same field component — so the two stay consistent
 * as the auth module grows.
 */
export function RegisterForm({ onSuccess }: RegisterFormProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const result = await register({ email, password });

      if (result.success) {
        onSuccess?.(result.user.id);
      } else {
        setError(result.error);
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      <CredentialsFields
        email={email}
        password={password}
        onEmailChange={setEmail}
        onPasswordChange={setPassword}
        passwordAutoComplete="new-password"
      />

      {error && (
        <p role="alert" data-testid="register-error">
          {error}
        </p>
      )}

      <button type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Creating account…" : "Create account"}
      </button>
    </form>
  );
}
