import { UUID } from '@ledgerly/shared/types';

import { Operation } from '../../domain/operations:toRefactor/operation.entity';

export type DatabaseTransaction = {
  query(sql: string, params?: unknown[]): Promise<unknown>;
};

export type OperationRepository = {
  create(
    userId: UUID,
    operation: Operation,
    tx?: DatabaseTransaction,
  ): Promise<Operation>;
  update(
    userId: UUID,
    operation: Operation,
    tx?: DatabaseTransaction,
  ): Promise<Operation>;
  getById(
    userId: UUID,
    id: UUID,
    tx?: DatabaseTransaction,
  ): Promise<Operation | null>;
  getAllByEntryId(
    userId: UUID,
    entryId: UUID,
    tx?: DatabaseTransaction,
  ): Promise<Operation[]>;
  delete(userId: UUID, id: UUID, tx?: DatabaseTransaction): Promise<boolean>;
  exists(userId: UUID, id: UUID, tx?: DatabaseTransaction): Promise<boolean>;
};
