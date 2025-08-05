import { AppError } from './AppError';

class UserNotFoundError extends AppError {
  constructor(message = 'User not found') {
    super(message, 401, 'UserNotFoundError');
  }
}

class InvalidPasswordError extends AppError {
  constructor(message = 'Invalid password') {
    super(message, 401, 'InvalidPasswordError');
  }
}

class UserExistsError extends AppError {
  constructor(message = 'User already exists') {
    super(message, 409, 'UserExistsError');
  }
}

class UnauthorizedError extends AppError {
  constructor(message = 'Unauthorized') {
    super(message, 401, 'UnauthorizedError');
  }
}

class EmailAlreadyExistsError extends AppError {
  constructor(message = 'Email already exists') {
    super(message, 409, 'EmailAlreadyExistsError');
  }
}

export const AuthErrors = {
  EmailAlreadyExistsError,
  InvalidPasswordError,
  UnauthorizedError,
  UserExistsError,
  UserNotFoundError,
};
