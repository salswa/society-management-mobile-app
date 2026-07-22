import type { PostgrestError } from '@supabase/supabase-js';
import { AppError } from './errors';

/**
 * Unwraps a Supabase query result, converting Postgres errors into AppErrors.
 * Maps common Postgres error codes to sensible HTTP statuses.
 */
export function unwrap<T>(result: {
  data: T | null;
  error: PostgrestError | null;
}): NonNullable<T> {
  if (result.error) {
    throw mapPostgrestError(result.error);
  }
  if (result.data === null || result.data === undefined) {
    throw new AppError(404, 'not_found', 'Resource not found');
  }
  return result.data as NonNullable<T>;
}

export function mapPostgrestError(error: PostgrestError): AppError {
  switch (error.code) {
    case '23505': // unique_violation
      return new AppError(409, 'conflict', 'A record with these details already exists');
    case '23503': // foreign_key_violation
      return new AppError(400, 'bad_request', 'Referenced record does not exist');
    case '23514': // check_violation
      return new AppError(400, 'bad_request', 'Value violates a data constraint');
    case 'PGRST116': // no rows for .single()
      return new AppError(404, 'not_found', 'Resource not found');
    default:
      return new AppError(500, 'db_error', error.message);
  }
}
