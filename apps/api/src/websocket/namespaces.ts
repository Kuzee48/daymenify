import { Server, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { env } from '@/config';
import { logger } from '@/lib/logger';

/**
 * JWT Token Payload
 */
interface TokenPayload {
  userId: string;
  username: string;
  role: string;
  iat?: number;
  exp?: number;
}

/**
 * Extended socket with auth data
 */
interface AuthenticatedSocket extends Socket {
  userId?: string;
  username?: string;
  role?: string;
}

/**
 * Setup Socket.io Namespaces
 *
 * Configures three namespaces with different auth requirements:
 * - /public: No authentication required (live feed, maintenance status)
 * - /user: JWT authentication required (transaction updates, notifications)
 * - /admin: Admin JWT required (alerts, real-time stats, new orders)
 */
export function setupNamespaces(io: Server): void {
  setupPublicNamespace(io);
  setupUserNamespace(io);
  setupAdminNamespace(io);
}

/**
 * Public namespace - no authentication required
 * Used for: live order feed, server status, maintenance notifications
 */
function setupPublicNamespace(io: Server): void {
  const publicNsp = io.of('/public');

  publicNsp.on('connection', (socket) => {
    logger.debug({ socketId: socket.id }, 'Client connected to /public');

    // Join public room
    socket.join('public-feed');

    socket.on('disconnect', () => {
      logger.debug({ socketId: socket.id }, 'Client disconnected from /public');
    });
  });
}

/**
 * User namespace - requires valid JWT token
 * Used for: transaction status updates, payment notifications, personal alerts
 */
function setupUserNamespace(io: Server): void {
  const userNsp = io.of('/user');

  // JWT Authentication middleware
  userNsp.use((socket: AuthenticatedSocket, next) => {
    const token = socket.handshake.auth?.token || socket.handshake.headers?.authorization?.replace('Bearer ', '');

    if (!token) {
      return next(new Error('Authentication required'));
    }

    try {
      const payload = jwt.verify(token, env.JWT_SECRET) as TokenPayload;
      socket.userId = payload.userId;
      socket.username = payload.username;
      socket.role = payload.role;
      next();
    } catch (error) {
      logger.warn({ socketId: socket.id, error }, 'Socket auth failed');
      return next(new Error('Invalid or expired token'));
    }
  });

  userNsp.on('connection', (socket: AuthenticatedSocket) => {
    const userId = socket.userId!;

    logger.debug({ socketId: socket.id, userId }, 'User connected to /user');

    // Join user-specific room for targeted notifications
    socket.join(`user:${userId}`);

    // Handle subscription to specific transaction updates
    socket.on('subscribe:transaction', (transactionId: string) => {
      socket.join(`transaction:${transactionId}`);
      logger.debug({ socketId: socket.id, userId, transactionId }, 'Subscribed to transaction');
    });

    socket.on('unsubscribe:transaction', (transactionId: string) => {
      socket.leave(`transaction:${transactionId}`);
    });

    // Handle notification read acknowledgment
    socket.on('notification:read', (notificationId: string) => {
      // Could update DB or emit back confirmation
      logger.debug({ userId, notificationId }, 'Notification marked as read via socket');
    });

    socket.on('disconnect', () => {
      logger.debug({ socketId: socket.id, userId }, 'User disconnected from /user');
    });
  });
}

/**
 * Admin namespace - requires valid JWT with admin/superadmin role
 * Used for: new order alerts, provider down alerts, real-time stats, system notifications
 */
function setupAdminNamespace(io: Server): void {
  const adminNsp = io.of('/admin');

  // JWT + Admin Role Authentication middleware
  adminNsp.use((socket: AuthenticatedSocket, next) => {
    const token = socket.handshake.auth?.token || socket.handshake.headers?.authorization?.replace('Bearer ', '');

    if (!token) {
      return next(new Error('Authentication required'));
    }

    try {
      const payload = jwt.verify(token, env.JWT_SECRET) as TokenPayload;

      // Verify admin role
      if (payload.role !== 'ADMIN' && payload.role !== 'SUPERADMIN') {
        return next(new Error('Admin access required'));
      }

      socket.userId = payload.userId;
      socket.username = payload.username;
      socket.role = payload.role;
      next();
    } catch (error) {
      logger.warn({ socketId: socket.id, error }, 'Admin socket auth failed');
      return next(new Error('Invalid or expired token'));
    }
  });

  adminNsp.on('connection', (socket: AuthenticatedSocket) => {
    const userId = socket.userId!;

    logger.debug({ socketId: socket.id, userId, role: socket.role }, 'Admin connected to /admin');

    // Join admin rooms
    socket.join('admin');
    socket.join('admin-alerts');

    socket.on('disconnect', () => {
      logger.debug({ socketId: socket.id, userId }, 'Admin disconnected from /admin');
    });
  });
}
