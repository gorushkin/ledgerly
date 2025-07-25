import { AppError } from '../AppError';

type DB_ERROR_CODES =
  | 'ALREADY_EXISTS'
  | 'FOREIGN_KEY'
  | 'INVALID_DATA'
  | 'NOT_FOUND';

export const DB_ERROR_CODES: Record<DB_ERROR_CODES, string> = {
  ALREADY_EXISTS: 'alreadyExists',
  FOREIGN_KEY: 'foreignKey',
  INVALID_DATA: 'invalidData',
  NOT_FOUND: 'notFound',
};

// `Record with ${field} = ${value} already exists in table ${tableName}`
// `Foreign key constraint failed: ${field} = ${value} does not exist in referenced table for ${tableName}`,
// `Record with id ${id} not found in table ${tableName}`

export class DatabaseError extends AppError {
  constructor(params: {
    message: string;
    context?: DBErrorContext;
    cause?: Error;
  }) {
    super(params.message, 500, params.cause);
  }
}

export class RecordNotFoundError extends DatabaseError {
  constructor({
    context,
    message,
  }: {
    message?: string;
    context?: DBErrorContext;
  }) {
    super({
      context,
      message: message ?? DB_ERROR_CODES.NOT_FOUND,
    });
  }
}

export class InvalidDataError extends DatabaseError {
  constructor(message = '') {
    super({ message: `Invalid data: ${message}` });
  }
}

export type DBErrorContext = {
  field?: string;
  tableName?: string;
  value?: string;
};

export class RecordAlreadyExistsError extends DatabaseError {
  constructor({
    context,
    message = '',
  }: {
    message?: string;
    context?: DBErrorContext;
  }) {
    super({
      context,
      message: message ?? DB_ERROR_CODES.ALREADY_EXISTS,
    });
  }
}

export class ForeignKeyConstraintError extends DatabaseError {
  constructor({
    context,
    message = '',
  }: {
    message?: string;
    context?: DBErrorContext;
  }) {
    super({
      context,
      message: message ?? DB_ERROR_CODES.FOREIGN_KEY,
    });
  }
}
