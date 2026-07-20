"use client";

import { useState, type FormEvent } from "react";
import { login } from "@/services/authService";
import { CredentialsFields } from "./CredentialsFields";

interface LoginFormProps {
  /** Called after a successful login, e.g. to redirect the user. */
  onSuccess?: (userId: string) => void;
}

/**
 * Login form for the auth module. Kept dumb about routing/redirects —
 * the caller decides what happens on success via onSuccess, which keeps
 * this component reusable (e.g. inside a modal vs. a dedicated page).
 */
export function LoginForm({ onSuccess }: LoginFormProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const result = await login({ email, password });

      if (result.success) {
        onSuccess?.(result.user.id);
      } else {
        setError(result.error);
      }
    } catch {
      // Network/parsing failure, distinct from an application-level
      // auth error returned by the API.
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
        passwordAutoComplete="current-password"
      />

      {error && (
        <p role="alert" data-testid="login-error">
          {error}
        </p>
      )}

      <button type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}
