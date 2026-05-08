import type { AuthTokens, AuthUser } from './auth';

// ============================================
// API Response Types (specific endpoint responses)
// ============================================

export interface LoginResponse {
  user: AuthUser;
  tokens: AuthTokens;
}

export interface RegisterResponse {
  user: AuthUser;
  tokens: AuthTokens;
}

export interface RefreshResponse {
  tokens: AuthTokens;
}

export interface MeResponse {
  user: AuthUser;
}
