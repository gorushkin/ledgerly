import { HttpApiError } from './HttpError';

class UserNotFoundError extends HttpApiError {
  constructor(message = 'User not found') {
    super(message, 401);
  }
}

class InvalidPasswordError extends HttpApiError {
  constructor(message = 'Invalid password') {
    super(message, 401);
  }
}

class UserExistsError extends HttpApiError {
  constructor(message = 'User already exists') {
    super(message, 409);
  }
}

class UnauthorizedError extends HttpApiError {
  constructor(message = 'Unauthorized') {
    super(message, 401);
  }
}

class EmailAlreadyExistsError extends HttpApiError {
  constructor(message = 'Email already exists') {
    super(message, 409);
  }
}

export const AuthErrors = {
  EmailAlreadyExistsError,
  InvalidPasswordError,
  UnauthorizedError,
  UserExistsError,
  UserNotFoundError,
};
