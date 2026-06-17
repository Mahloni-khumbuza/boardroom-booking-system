export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
}

export interface AuthUser {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  role?: string;
}

// Backend returns LoginResponseData directly (no envelope wrapper)
export interface LoginResponse {
  accessToken: string;
  expiresIn?: string;
  user?: AuthUser;
}

export type RegisterResponse = LoginResponse;
