import { Request, Response } from 'express';
import * as authService from './auth.service';
import { success, created, noContent } from '@/lib/response';
import { AuthenticationError } from '@/lib/errors';
import { env } from '@/config';

const REFRESH_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: env.NODE_ENV === 'production',
  sameSite: 'strict' as const,
  path: '/api/v1/auth/refresh',
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
};

export async function register(req: Request, res: Response): Promise<Response> {
  const result = await authService.register(req.body);

  // Set refresh token as httpOnly cookie
  res.cookie('refreshToken', result.tokens.refreshToken, REFRESH_COOKIE_OPTIONS);

  return created(res, {
    user: result.user,
    accessToken: result.tokens.accessToken,
  });
}

export async function login(req: Request, res: Response): Promise<Response> {
  const result = await authService.login(req.body);

  // Set refresh token as httpOnly cookie
  res.cookie('refreshToken', result.tokens.refreshToken, REFRESH_COOKIE_OPTIONS);

  return success(res, {
    user: result.user,
    accessToken: result.tokens.accessToken,
  });
}

export async function refresh(req: Request, res: Response): Promise<Response> {
  // Get refresh token from cookie or body
  const refreshToken =
    (req.cookies?.refreshToken as string | undefined) ?? req.body?.refreshToken;

  if (!refreshToken) {
    throw new AuthenticationError('No refresh token provided');
  }

  if (!req.user) {
    throw new AuthenticationError('Authentication required');
  }

  const tokens = await authService.refresh(req.user.userId, refreshToken);

  // Set new refresh token as httpOnly cookie
  res.cookie('refreshToken', tokens.refreshToken, REFRESH_COOKIE_OPTIONS);

  return success(res, {
    accessToken: tokens.accessToken,
  });
}

export async function logout(req: Request, res: Response): Promise<Response> {
  if (!req.user) {
    throw new AuthenticationError('Authentication required');
  }

  await authService.logout(req.user.userId);

  // Clear refresh token cookie
  res.clearCookie('refreshToken', {
    ...REFRESH_COOKIE_OPTIONS,
    maxAge: 0,
  });

  return noContent(res);
}
