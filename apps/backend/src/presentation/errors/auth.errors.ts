import { HttpApiError } from './HttpError';

/**
 * Thrown when authentication is required or token is invalid.
 * Used in middleware to return HTTP 401.
 */
class UnauthorizedError extends HttpApiError {
  constructor(message = 'Unauthorized') {
    super(message, 401);
  }
}

export const AuthErrors = {
  UnauthorizedError,
};
