import type { NextFunction, Request, Response } from 'express';
import { ZodError, type ZodTypeAny, type infer as ZodInfer } from 'zod';
import { badRequest } from '../lib/errors';

type Schemas = {
  body?: ZodTypeAny;
  query?: ZodTypeAny;
  params?: ZodTypeAny;
};

/**
 * Validates request parts against Zod schemas and replaces them with the parsed
 * (typed, coerced) values. Access via the typed helpers below in handlers.
 */
export function validate(schemas: Schemas) {
  return (req: Request, _res: Response, next: NextFunction) => {
    try {
      if (schemas.body) req.body = schemas.body.parse(req.body);
      if (schemas.query) (req as Request & { validatedQuery: unknown }).validatedQuery = schemas.query.parse(req.query);
      if (schemas.params) (req as Request & { validatedParams: unknown }).validatedParams = schemas.params.parse(req.params);
      next();
    } catch (err) {
      if (err instanceof ZodError) {
        return next(
          badRequest(
            'Validation failed',
            err.issues.map((i) => ({ path: i.path.join('.'), message: i.message }))
          )
        );
      }
      next(err);
    }
  };
}

/** Typed accessor for a body validated by `validate({ body })`. */
export const body = <S extends ZodTypeAny>(req: Request): ZodInfer<S> => req.body as ZodInfer<S>;

/** Typed accessor for a query validated by `validate({ query })`. */
export const query = <S extends ZodTypeAny>(req: Request): ZodInfer<S> =>
  (req as Request & { validatedQuery: ZodInfer<S> }).validatedQuery;

/** Typed accessor for params validated by `validate({ params })`. */
export const params = <S extends ZodTypeAny>(req: Request): ZodInfer<S> =>
  (req as Request & { validatedParams: ZodInfer<S> }).validatedParams;
