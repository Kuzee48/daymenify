import { Request, Response, NextFunction } from 'express';
import { AppError, ValidationError } from '@/lib/errors';
import { logger } from '@/lib/logger';
import { env } from '@/config';

interface ErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    errors?: Record<string, string[]>;
    stack?: string;
  };
}

export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction
): Response {
  const requestId = req.headers['x-request-id'] as string | undefined;

  if (err instanceof AppError) {
    // Operational errors - expected and handled
    logger.warn(
      {
        err,
        requestId,
        statusCode: err.statusCode,
        code: err.code,
        path: req.path,
        method: req.method,
      },
      `Operational error: ${err.message}`
    );

    const response: ErrorResponse = {
      success: false,
      error: {
        code: err.code,
        message: err.message,
      },
    };

    if (err instanceof ValidationError && Object.keys(err.errors).length > 0) {
      response.error.errors = err.errors;
    }

    if (env.NODE_ENV === 'development') {
      response.error.stack = err.stack;
    }

    return res.status(err.statusCode).json(response);
  }

  // Unexpected errors - log full details
  logger.error(
    {
      err,
      requestId,
      path: req.path,
      method: req.method,
    },
    `Unexpected error: ${err.message}`
  );

  const response: ErrorResponse = {
    success: false,
    error: {
      code: 'INTERNAL_ERROR',
      message:
        env.NODE_ENV === 'production'
          ? 'An unexpected error occurred'
          : err.message,
    },
  };

  if (env.NODE_ENV === 'development') {
    response.error.stack = err.stack;
  }

  return res.status(500).json(response);
}
