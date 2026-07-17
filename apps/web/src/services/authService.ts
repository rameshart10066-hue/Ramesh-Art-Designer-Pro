import type { LoginRequest, LoginResponse } from "@ramesh/api-contracts";

/**
 * Client-side auth service. UI components call these functions instead of
 * calling fetch() directly, so request/response shape and error handling
 * stay in one place (single responsibility) and are reusable by any future
 * auth-consuming component.
 */
export async function login(credentials: LoginRequest): Promise<LoginResponse> {
  const response = await fetch("/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(credentials),
  });

  // The API route always returns a LoginResponse-shaped body, even on
  // 4xx/5xx, so we can parse and return it directly rather than throwing.
  return (await response.json()) as LoginResponse;
}
