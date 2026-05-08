import { Request, Response, NextFunction } from 'express';
import { AnyZodObject, ZodError, ZodSchema } from 'zod';
import { ValidationError } from '@/lib/errors';
import { asyncHandler } from '@/lib/async-handler';

interface ValidationSchemas {
  body?: ZodSchema;
  params?: AnyZodObject;
  query?: AnyZodObject;
}

/**
 * Validates request body, params, and/or query against Zod schemas.
 * Replaces req.body/params/query with the parsed (and transformed) values.
 */
export function validate(schemas: ValidationSchemas) {
  return asyncHandler(async (req: Request, _res: Response, next: NextFunction) => {
    try {
      if (schemas.body) {
        req.body = await schemas.body.parseAsync(req.body);
      }

      if (schemas.params) {
        req.params = (await schemas.params.parseAsync(req.params)) as typeof req.params;
      }

      if (schemas.query) {
        req.query = (await schemas.query.parseAsync(req.query)) as typeof req.query;
      }

      next();
    } catch (err) {
      if (err instanceof ZodError) {
        const fieldErrors: Record<string, string[]> = {};

        for (const issue of err.issues) {
          const path = issue.path.join('.');
          if (!fieldErrors[path]) {
            fieldErrors[path] = [];
          }
          fieldErrors[path].push(issue.message);
        }

        throw new ValidationError('Validation failed', fieldErrors);
      }

      throw err;
    }
  });
}
