// ============================================
// Application Constants
// ============================================

export const APP_NAME = 'Daymenify';
export const APP_DESCRIPTION = 'Platform top-up & marketplace digital terpercaya di Indonesia';
export const APP_URL = 'https://daymenify.com';

// Pagination defaults
export const DEFAULT_PAGE = 1;
export const DEFAULT_LIMIT = 20;
export const MAX_LIMIT = 100;

// Auth constants
export const ACCESS_TOKEN_EXPIRY = '15m';
export const REFRESH_TOKEN_EXPIRY_DAYS = 7;
export const REFRESH_TOKEN_REMEMBER_DAYS = 30;
export const PASSWORD_MIN_LENGTH = 8;
export const PASSWORD_MAX_LENGTH = 128;
export const MAX_LOGIN_ATTEMPTS = 5;
export const LOGIN_LOCKOUT_MINUTES = 15;

// Rate limiting
export const RATE_LIMIT_AUTH = { windowMs: 15 * 60 * 1000, max: 5 };
export const RATE_LIMIT_API = { windowMs: 60 * 1000, max: 100 };
export const RATE_LIMIT_WEBHOOK = { windowMs: 60 * 1000, max: 500 };

// File upload
export const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
export const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

// Cache TTLs (seconds)
export const CACHE_TTL = {
  PRODUCTS: 300,        // 5 minutes
  CATEGORIES: 1800,     // 30 minutes
  SETTINGS: 600,        // 10 minutes
  USER_SESSION: 900,    // 15 minutes
  FLASH_SALE: 30,       // 30 seconds
  PROVIDER_HEALTH: 120, // 2 minutes
} as const;
