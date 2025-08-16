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
  | { type: 'primary_key'; table: string; field: string; value?: string }
  | { type: 'unknown'; original: Error };

type RetryAwareContext = DBErrorContext & {
  retryOnPkCollision?: boolean;
  maxPkCollisionRetries?: number;
};

const DEFAULT_MAX_RETRIES = 3;

export class BaseRepository {
  constructor(readonly db: DataBase) {}

  protected get createTimestamps() {
    const now = new Date().toISOString();
    return { createdAt: now, updatedAt: now };
  }

  protected get updateTimestamp() {
    return { updatedAt: new Date().toISOString() };
  }

  protected get uuid(): { id: string } {
    return { id: crypto.randomUUID() };
  }

  protected async executeDatabaseOperation<T>(
    operation: () => Promise<T>,
    errorMessage: string,
    context?: RetryAwareContext,
  ): Promise<T> {
    const retryEnabled = context?.retryOnPkCollision ?? true;
    const maxRetries = context?.maxPkCollisionRetries ?? DEFAULT_MAX_RETRIES;

    let attempt = 0;

    while (true) {
      try {
        return await operation();
      } catch (error) {
        const normalized = adaptLibsqlError(error, context);

        if (normalized) {
          if (normalized.type === 'foreign_key') {
            throw new ForeignKeyConstraintError({
              context: {
                field: normalized.field,
                tableName: normalized.table,
                value: normalized.value,
              },
            });
          }

          if (normalized.type === 'unique') {
            throw new RecordAlreadyExistsError({
              context: {
                field: normalized.field,
                tableName: normalized.table,
                value: normalized.value,
              },
            });
          }

          if (normalized.type === 'primary_key') {
            if (retryEnabled && attempt < maxRetries) {
              attempt++;
              if (process.env.NODE_ENV !== 'test') {
                console.error(
                  `PK/UNIQUE collision detected (attempt ${attempt}/${maxRetries}). Retrying…`,
                  {
                    field: normalized.field,
                    table: normalized.table,
                    value: normalized.value,
                  },
                );
              }
              continue;
            }

            throw new RecordAlreadyExistsError({
              context: {
                field: normalized.field,
                tableName: normalized.table,
                value: normalized.value,
              },
            });
          }
        }

        if (error instanceof InvalidDataError) throw error;
        if (error instanceof BusinessLogicError) throw error;

        if (process.env.NODE_ENV !== 'test') {
          console.error(`Database error: ${errorMessage}`, error);
        }

        throw new DatabaseError({
          cause: error as Error,
          context,
          message: errorMessage,
        });
      }
    }
  }

  protected getSafeUpdate<
    TInput extends Record<string, unknown>,
    TAllowed extends keyof TInput,
  >(data: TInput, allowedFields: readonly TAllowed[]): Pick<TInput, TAllowed> {
    const result = {} as Pick<TInput, TAllowed>;
    for (const key of allowedFields) {
      if (key in data) result[key] = data[key];
    }
    return result;
  }
}
