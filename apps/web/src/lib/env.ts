/**
 * Client-side environment variable validation.
 * All public env vars must be prefixed with NEXT_PUBLIC_.
 */

function getEnvVar(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(
      `Missing environment variable: ${key}. Please check your .env.local file.`
    );
  }
  return value;
}

function getOptionalEnvVar(key: string, defaultValue: string): string {
  return process.env[key] || defaultValue;
}

export const env = {
  /** Base URL for the API server */
  NEXT_PUBLIC_API_URL: getOptionalEnvVar(
    'NEXT_PUBLIC_API_URL',
    'http://localhost:4000'
  ),

  /** WebSocket URL for real-time features */
  NEXT_PUBLIC_SOCKET_URL: getOptionalEnvVar(
    'NEXT_PUBLIC_SOCKET_URL',
    'http://localhost:4000'
  ),

  /** Public-facing app URL */
  NEXT_PUBLIC_APP_URL: getOptionalEnvVar(
    'NEXT_PUBLIC_APP_URL',
    'http://localhost:3000'
  ),

  /** Whether running in production */
  isProduction: process.env.NODE_ENV === 'production',

  /** Whether running in development */
  isDevelopment: process.env.NODE_ENV === 'development',
} as const;

export type Env = typeof env;
