import { AppError } from '../AppError';

export const DB_ERROR_CODES: Record<string, string> = {
  ALREADY_EXISTS: 'alreadyExists',
  FOREIGN_KEY: 'foreignKey',
  INVALID_DATA: 'invalidData',
  NOT_FOUND: 'notFound',
};

// `Record with ${field} = ${value} already exists in table ${tableName}`
// `Foreign key constraint failed: ${field} = ${value} does not exist in referenced table for ${tableName}`,
// `Record with id ${id} not found in table ${tableName}`

export class DatabaseError extends AppError {
  constructor(message: string, cause?: Error) {
    super(message, 500, cause);
  }
}

export class RecordNotFoundError extends DatabaseError {
  constructor(_tableName: string, _id: number | string) {
    super(DB_ERROR_CODES.NOT_FOUND);
  }
}

export class InvalidDataError extends DatabaseError {
  constructor(message: string) {
    super(`Invalid data: ${message}`);
  }
}

export type DBErrorContext = {
  field: string;
  tableName: string;
  value: string;
};

export class RecordAlreadyExistsError extends DatabaseError {
  constructor(_tableName: string, _field: string, _value?: string) {
    super(DB_ERROR_CODES.alreadyExists);
  }
}

export class ForeignKeyConstraintError extends DatabaseError {
  constructor(_tableName: string, _field: string, _value?: string) {
    super(DB_ERROR_CODES.foreignKey);
  }
}
