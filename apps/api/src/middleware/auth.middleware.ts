import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '@/config';
import { AuthenticationError } from '@/lib/errors';
import { asyncHandler } from '@/lib/async-handler';
import { logger } from '@/lib/logger';

interface JwtPayload {
  userId: string;
  email: string;
  role: string;
  iat: number;
  exp: number;
}

export const authenticate = asyncHandler(
  async (req: Request, _res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;
    const tokenFromCookie = req.cookies?.accessToken as string | undefined;

    let token: string | undefined;

    if (authHeader?.startsWith('Bearer ')) {
      token = authHeader.slice(7);
    } else if (tokenFromCookie) {
      token = tokenFromCookie;
    }

    if (!token) {
      throw new AuthenticationError('No authentication token provided');
    }

    try {
      const decoded = jwt.verify(token, env.JWT_SECRET) as JwtPayload;

      req.user = {
        userId: decoded.userId,
        email: decoded.email,
        role: decoded.role,
      };

      next();
    } catch (err) {
      if (err instanceof jwt.TokenExpiredError) {
        throw new AuthenticationError('Token has expired');
      }
      if (err instanceof jwt.JsonWebTokenError) {
        throw new AuthenticationError('Invalid token');
      }
      logger.error({ err }, 'Unexpected JWT verification error');
      throw new AuthenticationError('Authentication failed');
    }
  }
);
