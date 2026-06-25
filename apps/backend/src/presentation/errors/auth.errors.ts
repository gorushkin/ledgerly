import { HttpApiError } from 'src/presentation/errors/HttpError';

/**
 * Thrown when authentication is required or token is invalid.
 * Used in middleware to return HTTP 401.
 */
export class UnauthorizedError extends HttpApiError {
  constructor(message = 'Unauthorized') {
    super(message, 401);
  }
}
