import type {
  AuthResponse,
  LoginRequest,
  RegisterRequest,
  SessionResponse,
} from "@ramesh/api-contracts";

/**
 * Client-side auth service. UI components call these functions instead of
 * calling fetch() directly, so request/response shape and error handling
 * stay in one place (single responsibility) and are reusable by any future
 * auth-consuming component.
 */
export async function login(credentials: LoginRequest): Promise<AuthResponse> {
  const response = await fetch("/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(credentials),
  });
  // The API route always returns an AuthResponse-shaped body, even on
  // 4xx/5xx, so we can parse and return it directly rather than throwing.
  return (await response.json()) as AuthResponse;
}

export async function register(credentials: RegisterRequest): Promise<AuthResponse> {
  const response = await fetch("/api/auth/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(credentials),
  });
  return (await response.json()) as AuthResponse;
}

export async function logout(): Promise<void> {
  await fetch("/api/auth/logout", { method: "POST" });
}

export async function getSession(): Promise<SessionResponse> {
  const response = await fetch("/api/auth/session");
  return (await response.json()) as SessionResponse;
}
