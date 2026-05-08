import { Request, Response, NextFunction } from 'express';
import { AuthorizationError, AuthenticationError } from '@/lib/errors';
import { asyncHandler } from '@/lib/async-handler';

/**
 * Role-based access control middleware.
 * Requires the `authenticate` middleware to have run first.
 * Checks if the authenticated user has at least one of the required permissions/roles.
 */
export function requirePermission(...permissions: string[]) {
  return asyncHandler(async (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) {
      throw new AuthenticationError('Authentication required');
    }

    const userRole = req.user.role;

    // Admin has all permissions
    if (userRole === 'ADMIN' || userRole === 'SUPER_ADMIN') {
      return next();
    }

    // Check if user's role matches any of the required permissions
    const hasPermission = permissions.includes(userRole);

    if (!hasPermission) {
      throw new AuthorizationError(
        `Insufficient permissions. Required: ${permissions.join(' or ')}`
      );
    }

    next();
  });
}

/**
 * Requires the user to have one of the specified roles.
 */
export function requireRole(...roles: string[]) {
  return requirePermission(...roles);
}
