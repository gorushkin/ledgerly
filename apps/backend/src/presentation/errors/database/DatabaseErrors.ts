import { AppError } from '../AppError';

export class DatabaseError extends AppError {
  constructor(message: string, cause?: Error) {
    super(message, 500, cause);
  }
}

export class RecordNotFoundError extends DatabaseError {
  constructor(tableName: string, id: number | string) {
    super(`Record with id ${id} not found in table ${tableName}`);
  }
}

export class InvalidDataError extends DatabaseError {
  constructor(message: string) {
    super(`Invalid data: ${message}`);
  }
}
