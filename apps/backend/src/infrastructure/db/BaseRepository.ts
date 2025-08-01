import {
  DBErrorContext,
  DatabaseError,
  ForeignKeyConstraintError,
  InvalidDataError,
  RecordAlreadyExistsError,
} from 'src/presentation/errors';
import { BusinessLogicError } from 'src/presentation/errors/businessLogic.error';
import { adaptLibsqlError } from 'src/presentation/errors/database/libsql-adapter';
import { DataBase } from 'src/types';

export type NormalizedDbError =
  | { type: 'unique'; table: string; field: string; value?: string }
  | { type: 'foreign_key'; table: string; field: string; value?: string }
  | { type: 'unknown'; original: Error };

export class BaseRepository {
  constructor(readonly db: DataBase) {}
  protected get createTimestamps() {
    const now = new Date().toISOString();
    return {
      createdAt: now,
      updatedAt: now,
    };
  }

  protected get updateTimestamp() {
    return {
      updatedAt: new Date().toISOString(),
    };
  }

  protected async executeDatabaseOperation<T>(
    operation: () => Promise<T>,
    errorMessage: string,
    context?: DBErrorContext,
  ): Promise<T> {
    try {
      return await operation();
    } catch (error) {
      const normalized = adaptLibsqlError(error, context);

      if (normalized) {
        switch (normalized.type) {
          case 'unique':
            throw new RecordAlreadyExistsError({
              context: {
                field: normalized.field,
                tableName: normalized.table,
                value: normalized.value,
              },
            });
          case 'foreign_key':
            throw new ForeignKeyConstraintError({
              context: {
                field: normalized.field,
                tableName: normalized.table,
                value: normalized.value,
              },
            });
          case 'unknown':
            break;
        }
      }

      if (error instanceof InvalidDataError) {
        throw error;
      }

      if (error instanceof BusinessLogicError) {
        throw error;
      }

      console.error(`Database error: ${errorMessage}`, error);
      throw new DatabaseError({
        cause: error as Error,
        context,
        message: errorMessage,
      });
    }
  }
}
