import { AppError } from './AppError';

export class UserNotFoundError extends AppError {
  constructor(message = 'User not found') {
    super(message, 401);
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class InvalidPasswordError extends AppError {
  constructor(message = 'Invalid password') {
    super(message, 401);
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class UserExistsError extends AppError {
  constructor(message = 'User already exists') {
    super(message, 409);
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = 'Unauthorized') {
    super(message, 401);
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class EmailAlreadyExistsError extends AppError {
  constructor(message = 'Email already exists') {
    super(message, 409);
    Object.setPrototypeOf(this, new.target.prototype);
  }
}
