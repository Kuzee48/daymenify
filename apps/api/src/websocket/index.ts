import { Server as HttpServer } from 'http';
import { Server } from 'socket.io';
import { logger } from '@/lib/logger';
import { env } from '@/config';
import { setupNamespaces } from './namespaces';
import { setupEventListeners } from './listeners';

// Store io instance for access from other modules
let ioInstance: Server | null = null;

/**
 * Create and configure the Socket.io server
 *
 * @param httpServer - The HTTP server to attach Socket.io to
 * @returns Configured Socket.io server instance
 */
export function createSocketServer(httpServer: HttpServer): Server {
  const io = new Server(httpServer, {
    cors: {
      origin: env.FRONTEND_URL,
      credentials: true,
      methods: ['GET', 'POST'],
    },
    transports: ['websocket', 'polling'],
    pingTimeout: 60000,
    pingInterval: 25000,
    maxHttpBufferSize: 1e6, // 1MB max payload
  });

  // Redis adapter for horizontal scaling
  // Uncomment when deploying multiple instances:
  // import { createAdapter } from '@socket.io/redis-adapter';
  // import { createClient } from 'redis';
  // const pubClient = createClient({ url: env.REDIS_URL });
  // const subClient = pubClient.duplicate();
  // await Promise.all([pubClient.connect(), subClient.connect()]);
  // io.adapter(createAdapter(pubClient, subClient));

  // Setup namespaces with authentication
  setupNamespaces(io);

  // Setup event bus listeners for broadcasting
  setupEventListeners(io);

  // Connection tracking
  io.on('connection', (socket) => {
    logger.debug({ socketId: socket.id }, 'Socket connected to default namespace');

    socket.on('disconnect', (reason) => {
      logger.debug({ socketId: socket.id, reason }, 'Socket disconnected from default namespace');
    });
  });

  ioInstance = io;
  logger.info('Socket.io server initialized');
  return io;
}

/**
 * Get the current Socket.io server instance
 * @returns Socket.io server instance or null if not initialized
 */
export function getSocketServer(): Server | null {
  return ioInstance;
}
