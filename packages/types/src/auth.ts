import type { UserRole, UserStatus } from './enums';

// ============================================
// Authentication Types
// ============================================

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  name: string;
  phone?: string;
  referralCode?: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  avatar: string | null;
  role: UserRole;
  permissions: string[];
  status: UserStatus;
}

export interface JWTPayload {
  sub: string;
  email: string;
  role: UserRole;
  permissions: string[];
  iat: number;
  exp: number;
  jti: string;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}
