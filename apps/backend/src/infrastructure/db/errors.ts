import type { IdType } from './types';

export class DatabaseError extends Error {
  constructor(
    message: string,
    public readonly cause?: Error,
  ) {
    super(message);
    this.name = 'DatabaseError';
  }
}

export class RecordNotFoundError extends DatabaseError {
  constructor(tableName: string, id: IdType) {
    super(`Record with id ${id} not found in table ${tableName}`);
    this.name = 'RecordNotFoundError';
  }
}

export class InvalidDataError extends DatabaseError {
  constructor(message: string) {
    super(`Invalid data: ${message}`);
    this.name = 'InvalidDataError';
  }
}
