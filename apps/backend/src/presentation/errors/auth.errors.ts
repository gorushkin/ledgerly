import { AppError } from './AppError';

export class UserNotFoundError extends AppError {
  constructor(message = 'User not found') {
    super(message, 401);
  }
}

export class InvalidPasswordError extends AppError {
  constructor(message = 'Invalid password') {
    super(message, 401);
  }
}

export class UserExistsError extends AppError {
  constructor(message = 'User already exists') {
    super(message, 409);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = 'Unauthorized') {
    super(message, 401);
  }
}
