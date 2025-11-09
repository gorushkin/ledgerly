import { UUID } from '@ledgerly/shared/types';
import { isoDatetime } from '@ledgerly/shared/validation';
import {
  DBErrorContext,
  DatabaseError,
  ForeignKeyConstraintError,
  InvalidDataError,
  RecordAlreadyExistsError,
} from 'src/presentation/errors';
import { BusinessLogicError } from 'src/presentation/errors/businessLogic.error';
import { adaptLibsqlError } from 'src/presentation/errors/database/libsql-adapter';

import { TransactionManager } from './TransactionManager';

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
  constructor(protected readonly transactionManager: TransactionManager) {}

  protected getDbClient() {
    return this.transactionManager.getCurrentTransaction();
  }

  get db() {
    return this.getDbClient();
  }

  protected get createTimestamps() {
    const now = isoDatetime.parse(new Date().toISOString());
    return { createdAt: now, updatedAt: now };
  }

  protected get updateTimestamp() {
    const now = isoDatetime.parse(new Date().toISOString());
    return { updatedAt: now };
  }

  protected get uuid(): { id: UUID } {
    return { id: crypto.randomUUID() as UUID };
  }

  protected async executeDatabaseOperation<T>(
    operation: () => Promise<T>,
    errorMessage: string,
    context?: RetryAwareContext,
  ): Promise<T> {
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

  async writeNewEntryToDatabase<T, E extends { toPersistence: () => T }, K>(
    entity: E,
    promise: (data: T) => Promise<K>,
    onError: () => E,
    retries: number = DEFAULT_MAX_RETRIES,
  ): Promise<K> {
    try {
      return await promise(entity.toPersistence());
    } catch (error) {
      if (error instanceof RecordAlreadyExistsError && retries > 0) {
        const regeneratedEntity = onError();
        return await this.writeNewEntryToDatabase(
          regeneratedEntity,
          promise,
          onError,
          retries - 1,
        );
      }
      throw new Error('Failed to create account');
    }
  }
}
