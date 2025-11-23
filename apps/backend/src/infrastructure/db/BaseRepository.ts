import { UUID } from '@ledgerly/shared/types';
import { isoDatetime } from '@ledgerly/shared/validation';
import {
  ForbiddenAccessError,
  InfrastructureError,
  RepositoryNotFoundError,
} from 'src/infrastructure/infrastructure.errors';
import {
  DBErrorContext,
  DatabaseError,
  ForeignKeyConstraintError,
  InvalidDataError,
  RecordAlreadyExistsError,
} from 'src/presentation/errors';
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
      if (error instanceof InfrastructureError) throw error;

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

  /**
   * Ensures an entity exists, throwing RepositoryNotFoundError if not.
   * Use this to avoid if (!entity) throw error boilerplate.
   *
   * @param entity - The entity to check
   * @param message - Error message if entity doesn't exist
   * @returns The entity (guaranteed to be non-null)
   */
  protected ensureEntityExists<T>(
    entity: T | undefined | null,
    message: string,
  ): T {
    if (!entity) {
      throw new RepositoryNotFoundError(message);
    }
    return entity;
  }

  /**
   * Ensures a user has access to an entity, throwing ForbiddenAccessError if not.
   * Use this to check entity ownership.
   *
   * @param condition - The condition to check (e.g., entity.userId === userId)
   * @param message - Error message if access is denied
   */
  protected ensureAccess(condition: boolean, message: string): void {
    if (!condition) {
      throw new ForbiddenAccessError(message);
    }
  }

  async writeNewEntryToDatabase<T, E extends { toPersistence: () => T }, K>(
    entity: E,
    promise: (data: T) => Promise<K>,
    generateEntity: (prevEntity: E) => E,
    retries: number = DEFAULT_MAX_RETRIES,
  ): Promise<K> {
    try {
      return await promise(entity.toPersistence());
    } catch (error) {
      if (error instanceof RecordAlreadyExistsError && retries > 0) {
        const regeneratedEntity = generateEntity(entity);
        return await this.writeNewEntryToDatabase(
          regeneratedEntity,
          promise,
          generateEntity,
          retries - 1,
        );
      }
      throw new Error('Failed to create account');
    }
  }
}
