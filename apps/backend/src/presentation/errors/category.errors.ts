import { AppError } from './AppError';

export class CategoryNotFoundError extends AppError {
  constructor(message = 'Category not found') {
    super(message, 404);
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class CategoryExistsError extends AppError {
  constructor(message = 'Category already exists') {
    super(message, 409);
    Object.setPrototypeOf(this, new.target.prototype);
  }
}
