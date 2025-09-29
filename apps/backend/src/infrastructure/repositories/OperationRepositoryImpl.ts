import { UUID } from '@ledgerly/shared/types';
import { eq, and } from 'drizzle-orm';
import { operationsTable } from 'src/db/schemas';
import { DataBase } from 'src/types';

import type {
  OperationRepository,
  DatabaseTransaction,
} from '../../application/interfaces:toRefactor/OperationRepository.interface';
import { Operation } from '../../domain/operations:toRefactor/operation.entity';
import { BaseRepository } from '../db/BaseRepository';

export class OperationRepositoryImpl
  extends BaseRepository
  implements OperationRepository
{
  constructor(db: DataBase) {
    super(db);
  }

  private validateRequiredParams(userId: UUID, operationId: UUID): void {
    if (!userId) {
      throw new Error('User ID is required for operation access');
    }
    if (!operationId) {
      throw new Error('Operation ID is required');
    }
  }

  async create(
    userId: UUID,
    operation: Operation,
    _tx?: DatabaseTransaction,
  ): Promise<Operation> {
    this.validateRequiredParams(userId, operation.id ?? ('temp' as UUID));

    const operationData = {
      accountId: operation.accountId,
      amount: operation.amount,
      description: operation.description,
      entryId: operation.entryId,
      isSystem: operation.isSystem,
      type: operation.type,
      userId: operation.userId,
    };

    // Use BaseRepository helper for consistent error handling
    const result = await this.executeDatabaseOperation(
      () => {
        const insertData = {
          ...operationData,
          ...this.createTimestamps,
          ...this.uuid,
        };

        return this.db
          .insert(operationsTable)
          .values(insertData)
          .returning()
          .get();
      },
      'Failed to create operation',
      { field: 'operation', tableName: 'operations' },
    );

    // Restore operation from DB data
    return Operation.restore(
      userId,
      result.id,
      result.entryId,
      result.accountId,
      result.amount,
      result.type,
      result.isSystem,
      result.description,
    );
  }

  async update(
    userId: UUID,
    operation: Operation,
    _tx?: DatabaseTransaction,
  ): Promise<Operation> {
    this.validateRequiredParams(userId, operation.id!);

    if (operation.isNew()) {
      throw new Error('Cannot update a new operation. Use create instead.');
    }

    const updateData = {
      accountId: operation.accountId,
      amount: operation.amount,
      description: operation.description,
      isSystem: operation.isSystem,
      type: operation.type,
      ...this.updateTimestamp,
    };

    const result = await this.executeDatabaseOperation(
      () =>
        this.db
          .update(operationsTable)
          .set(updateData)
          .where(
            and(
              eq(operationsTable.id, operation.id!),
              eq(operationsTable.userId, userId),
            ),
          )
          .returning()
          .get(),
      'Failed to update operation',
    );

    return Operation.restore(
      userId,
      result.id,
      result.entryId,
      result.accountId,
      result.amount,
      result.type,
      result.isSystem,
      result.description,
    );
  }

  async getById(
    userId: UUID,
    id: UUID,
    _tx?: DatabaseTransaction,
  ): Promise<Operation | null> {
    this.validateRequiredParams(userId, id);

    // TODO: Handle transaction parameter properly later
    const result = await this.executeDatabaseOperation(
      () =>
        this.db
          .select()
          .from(operationsTable)
          .where(
            and(eq(operationsTable.id, id), eq(operationsTable.userId, userId)),
          )
          .get(),
      'Failed to fetch operation by ID',
    );

    if (!result) return null;

    return Operation.restore(
      userId,
      result.id,
      result.entryId,
      result.accountId,
      result.amount,
      result.type as 'debit' | 'credit',
      result.isSystem,
      result.description,
    );
  }

  async getAllByEntryId(
    userId: UUID,
    entryId: UUID,
    _tx?: DatabaseTransaction,
  ): Promise<Operation[]> {
    this.validateRequiredParams(userId, entryId);

    // TODO: Handle transaction parameter properly later
    const operationRows = await this.executeDatabaseOperation(
      () =>
        this.db
          .select()
          .from(operationsTable)
          .where(
            and(
              eq(operationsTable.entryId, entryId),
              eq(operationsTable.userId, userId),
            ),
          )
          .all(),
      'Failed to fetch operations by entry ID',
    );

    return operationRows.map((row) =>
      Operation.restore(
        userId,
        row.id,
        row.entryId,
        row.accountId,
        row.amount,
        row.type,
        row.isSystem,
        row.description,
      ),
    );
  }

  async delete(
    userId: UUID,
    id: UUID,
    _tx?: DatabaseTransaction,
  ): Promise<boolean> {
    this.validateRequiredParams(userId, id);

    const result = await this.executeDatabaseOperation(
      () =>
        this.db
          .delete(operationsTable)
          .where(
            and(eq(operationsTable.id, id), eq(operationsTable.userId, userId)),
          )
          .run(),
      'Failed to delete operation',
    );

    return result.rowsAffected > 0;
  }

  async exists(
    userId: UUID,
    id: UUID,
    _tx?: DatabaseTransaction,
  ): Promise<boolean> {
    this.validateRequiredParams(userId, id);

    const results = await this.executeDatabaseOperation(
      () =>
        this.db
          .select({ id: operationsTable.id })
          .from(operationsTable)
          .where(
            and(eq(operationsTable.id, id), eq(operationsTable.userId, userId)),
          )
          .limit(1)
          .all(),
      'Failed to check operation existence',
    );

    return results.length > 0;
  }
}
