/**
 * Auth domain contracts, shared between the API route
 * (apps/web/src/app/api/auth/login) and the client service/UI
 * (apps/web/src/services/authService, src/modules/auth).
 */

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginSuccessResponse {
  success: true;
  user: {
    id: string;
    email: string;
  };
}

export interface LoginErrorResponse {
  success: false;
  error: string;
}

export type LoginResponse = LoginSuccessResponse | LoginErrorResponse;
