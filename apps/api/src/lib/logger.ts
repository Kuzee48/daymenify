import pino from 'pino';
import { env } from '@/config';

export const logger = pino({
  level: env.LOG_LEVEL,
  transport:
    env.NODE_ENV === 'development'
      ? {
          target: 'pino-pretty',
          options: {
            colorize: true,
            translateTime: 'SYS:standard',
            ignore: 'pid,hostname',
          },
        }
      : undefined,
  serializers: {
    req: (req) => ({
      method: req.method,
      url: req.url,
      requestId: req.headers?.['x-request-id'],
    }),
    res: (res) => ({
      statusCode: res.statusCode,
    }),
    err: pino.stdSerializers.err,
  },
  base: {
    service: '@daymenify/api',
    env: env.NODE_ENV,
  },
});

export function createChildLogger(context: Record<string, unknown>) {
  return logger.child(context);
}

export type Logger = typeof logger;
