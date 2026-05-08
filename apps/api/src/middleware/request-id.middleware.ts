import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';

/**
 * Adds a unique X-Request-ID header to every request.
 * If the client already provides one, it is preserved.
 */
export function requestId(req: Request, res: Response, next: NextFunction): void {
  const existingId = req.headers['x-request-id'] as string | undefined;
  const id = existingId ?? uuidv4();

  req.headers['x-request-id'] = id;
  res.setHeader('X-Request-ID', id);

  next();
}
