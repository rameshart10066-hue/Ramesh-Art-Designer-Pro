/**
 * Auth domain contracts, shared between the API route
 * (apps/web/src/app/api/auth/login) and the client service/UI
 * (apps/web/src/services/authService, src/modules/auth).
 */

export interface SessionUser {
  id: string;
  email: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
}

export interface AuthSuccessResponse {
  success: true;
  user: SessionUser;
}

export interface AuthErrorResponse {
  success: false;
  error: string;
}

export type AuthResponse = AuthSuccessResponse | AuthErrorResponse;

/** @deprecated Use AuthSuccessResponse — kept as an alias for backwards compatibility. */
export type LoginSuccessResponse = AuthSuccessResponse;
/** @deprecated Use AuthErrorResponse — kept as an alias for backwards compatibility. */
export type LoginErrorResponse = AuthErrorResponse;
/** @deprecated Use AuthResponse — kept as an alias for backwards compatibility. */
export type LoginResponse = AuthResponse;

export interface SessionResponse {
  user: SessionUser | null;
}
