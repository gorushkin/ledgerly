import { type ErrorContextByCode, UUID } from '@ledgerly/shared/types';
import { isoDatetime } from '@ledgerly/shared/validation';
import {
  DBErrorContext,
  DatabaseOperationError,
  ForbiddenAccessError,
  ForeignKeyConstraintError,
  InfrastructureError,
  InvalidDataError,
  RecordAlreadyExistsError,
  RepositoryNotFoundError,
} from 'src/infrastructure/errors';
import { reportDatabaseError } from 'src/shared/errors/reportDatabaseError';

import { adaptLibsqlError } from './libsql-adapter';
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

      const databaseError = new DatabaseOperationError({
        cause: error as Error,
        context,
        message: errorMessage,
      });
      reportDatabaseError(databaseError);
      throw databaseError;
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
   * Builds the only public context allowed for repository not-found errors.
   * The result is serialized in the API response, so callers must not add
   * diagnostics beyond the entity type and, when safe to expose, its ID.
   */
  protected entityNotFoundContext(
    entityType: string,
    entityId?: UUID,
  ): ErrorContextByCode['ENTITY_NOT_FOUND'] {
    return entityId ? { entityId, entityType } : { entityType };
  }

  /**
   * Builds the only public context allowed for repository access-denied errors.
   * The result is serialized in the API response, so callers must not add
   * diagnostics beyond the entity type and, when safe to expose, its ID.
   */
  protected unauthorizedAccessContext(
    entityType: string,
    entityId?: UUID,
  ): ErrorContextByCode['UNAUTHORIZED_ACCESS'] {
    return entityId ? { entityId, entityType } : { entityType };
  }

  /**
   * Ensures an entity exists, throwing RepositoryNotFoundError if not.
   * The context becomes the public API context of the coded error, so it must
   * contain only allowlisted entity metadata: `entityType` and, when it is
   * safe to expose, `entityId`. Never include repository messages, database
   * details, user identifiers, or other diagnostics.
   *
   * @param entity - The entity to check
   * @param message - Error message if entity doesn't exist
   * @param context - Client-safe entity metadata surfaced in the API error response
   * @returns The entity (guaranteed to be non-null)
   */
  protected ensureEntityExists<T>(
    entity: T | undefined | null,
    message: string,
    context: ErrorContextByCode['ENTITY_NOT_FOUND'],
  ): T {
    if (!entity) {
      throw new RepositoryNotFoundError(message, context);
    }
    return entity;
  }

  /**
   * Ensures a user has access to an entity, throwing ForbiddenAccessError if not.
   * The context becomes the public API context of the coded error, so it must
   * contain only allowlisted entity metadata: `entityType` and, when it is
   * safe to expose, `entityId`. Never include repository messages, database
   * details, user identifiers, or other diagnostics.
   *
   * @param condition - The condition to check (e.g., entity.userId === userId)
   * @param message - Error message if access is denied
   * @param context - Client-safe entity metadata surfaced in the API error response
   */
  protected ensureAccess(
    condition: boolean,
    message: string,
    context: ErrorContextByCode['UNAUTHORIZED_ACCESS'],
  ): void {
    if (!condition) {
      throw new ForbiddenAccessError(message, context);
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

      const databaseError = new DatabaseOperationError({
        cause: error instanceof Error ? error : new Error(String(error)),
        message: 'Failed to create entity',
      });
      reportDatabaseError(databaseError);
      throw databaseError;
    }
  }
}
