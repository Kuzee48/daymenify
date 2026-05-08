import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { env } from '@/config';
import { prisma } from '@/lib/prisma';
import { redis } from '@/lib/redis';
import { logger } from '@/lib/logger';
import {
  AuthenticationError,
  ConflictError,
  NotFoundError,
} from '@/lib/errors';
import { RegisterInput, LoginInput } from './auth.validator';

const SALT_ROUNDS = 12;
const REFRESH_TOKEN_PREFIX = 'refresh_token:';

interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

interface AuthResponse {
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: string;
  };
  tokens: TokenPair;
}

function generateAccessToken(payload: { userId: string; email: string; role: string }): string {
  return jwt.sign(payload, env.JWT_SECRET, {
    expiresIn: env.JWT_ACCESS_EXPIRES_IN,
  });
}

function generateRefreshToken(): string {
  return uuidv4();
}

function getRefreshExpirySeconds(): number {
  const expiresIn = env.JWT_REFRESH_EXPIRES_IN;
  const match = expiresIn.match(/^(\d+)([smhd])$/);
  if (!match) return 7 * 24 * 60 * 60; // Default 7 days

  const value = parseInt(match[1], 10);
  const unit = match[2];

  switch (unit) {
    case 's':
      return value;
    case 'm':
      return value * 60;
    case 'h':
      return value * 60 * 60;
    case 'd':
      return value * 24 * 60 * 60;
    default:
      return 7 * 24 * 60 * 60;
  }
}

async function storeRefreshToken(userId: string, refreshToken: string): Promise<void> {
  const hashedToken = await bcrypt.hash(refreshToken, SALT_ROUNDS);
  const expirySeconds = getRefreshExpirySeconds();
  const key = `${REFRESH_TOKEN_PREFIX}${userId}`;

  await redis.set(key, hashedToken, 'EX', expirySeconds);
}

async function verifyStoredRefreshToken(userId: string, refreshToken: string): Promise<boolean> {
  const key = `${REFRESH_TOKEN_PREFIX}${userId}`;
  const storedHash = await redis.get(key);

  if (!storedHash) {
    return false;
  }

  return bcrypt.compare(refreshToken, storedHash);
}

async function invalidateRefreshToken(userId: string): Promise<void> {
  const key = `${REFRESH_TOKEN_PREFIX}${userId}`;
  await redis.del(key);
}

export async function register(input: RegisterInput): Promise<AuthResponse> {
  const { email, password, firstName, lastName } = input;

  // Check if user already exists
  const existingUser = await prisma.user.findUnique({
    where: { email: email.toLowerCase() },
  });

  if (existingUser) {
    throw new ConflictError('An account with this email already exists');
  }

  // Hash password
  const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

  // Create user
  const user = await prisma.user.create({
    data: {
      email: email.toLowerCase(),
      password: hashedPassword,
      firstName,
      lastName,
      role: 'USER',
    },
  });

  // Generate tokens
  const accessToken = generateAccessToken({
    userId: user.id,
    email: user.email,
    role: user.role,
  });
  const refreshToken = generateRefreshToken();

  // Store hashed refresh token
  await storeRefreshToken(user.id, refreshToken);

  logger.info({ userId: user.id }, 'User registered successfully');

  return {
    user: {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
    },
    tokens: {
      accessToken,
      refreshToken,
    },
  };
}

export async function login(input: LoginInput): Promise<AuthResponse> {
  const { email, password } = input;

  // Find user
  const user = await prisma.user.findUnique({
    where: { email: email.toLowerCase() },
  });

  if (!user) {
    throw new AuthenticationError('Invalid email or password');
  }

  // Verify password
  const isPasswordValid = await bcrypt.compare(password, user.password);

  if (!isPasswordValid) {
    throw new AuthenticationError('Invalid email or password');
  }

  // Invalidate any existing refresh tokens (single session)
  await invalidateRefreshToken(user.id);

  // Generate tokens
  const accessToken = generateAccessToken({
    userId: user.id,
    email: user.email,
    role: user.role,
  });
  const refreshToken = generateRefreshToken();

  // Store hashed refresh token
  await storeRefreshToken(user.id, refreshToken);

  logger.info({ userId: user.id }, 'User logged in successfully');

  return {
    user: {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
    },
    tokens: {
      accessToken,
      refreshToken,
    },
  };
}

export async function refresh(
  userId: string,
  currentRefreshToken: string
): Promise<TokenPair> {
  // Verify the refresh token
  const isValid = await verifyStoredRefreshToken(userId, currentRefreshToken);

  if (!isValid) {
    // Possible token reuse attack - invalidate all tokens for this user
    await invalidateRefreshToken(userId);
    logger.warn({ userId }, 'Refresh token reuse detected, invalidating all tokens');
    throw new AuthenticationError('Invalid refresh token. Please log in again.');
  }

  // Fetch current user data
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    throw new NotFoundError('User');
  }

  // Rotate: invalidate old token and create new pair
  await invalidateRefreshToken(userId);

  const accessToken = generateAccessToken({
    userId: user.id,
    email: user.email,
    role: user.role,
  });
  const newRefreshToken = generateRefreshToken();

  // Store new hashed refresh token
  await storeRefreshToken(user.id, newRefreshToken);

  logger.debug({ userId }, 'Tokens refreshed');

  return {
    accessToken,
    refreshToken: newRefreshToken,
  };
}

export async function logout(userId: string): Promise<void> {
  await invalidateRefreshToken(userId);
  logger.info({ userId }, 'User logged out');
}
