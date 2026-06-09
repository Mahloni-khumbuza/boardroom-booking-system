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

export interface LoginResponse {
  accessToken: string;
  refreshToken?: string;
  user?: AuthUser;
}

export interface RegisterResponse {
  id: string;
  email: string;
}
