import {
  EntryApplyDTO,
  EntryCreateDTO,
  EntryUpdateDTO,
  UUID,
} from '@ledgerly/shared/types';
import { OperationDbRow, OperationRepoInsert } from 'src/db/schemas/operations';
import { OperationRepository } from 'src/infrastructure/db/OperationRepository';
import { DataBase } from 'src/types';

import { BaseService } from './baseService';

export class OperationService extends BaseService {
  constructor(private readonly operationRepository: OperationRepository) {
    super();
  }

  async listByTransactionId(userId: UUID, transactionId: UUID) {
    return this.operationRepository.listByTransactionId(userId, transactionId);
  }

  private validateBalance(items: EntryCreateDTO[]) {
    let totalAmount = 0;

    items.forEach((item) => {
      totalAmount += item.amount;
    });

    if (totalAmount !== 0) {
      throw new Error(`Invalid balance: expected 0, got ${totalAmount}`);
    }
  }

  private validateOperationsCount(items: EntryCreateDTO[]) {
    if (items.length < 2) {
      throw new Error('At least two operations are required');
    }
  }

  private addExtraOperations() {}

  async toInsert(
    userId: UUID,
    transactionId: UUID,
    items: EntryCreateDTO[],
    tx?: DataBase,
  ): Promise<OperationDbRow[]> {
    this.validateOperationsCount(items);

    this.validateBalance(items);

    return Promise.all(
      items.map(async (operation) => {
        return this.operationRepository.create(
          userId,
          {
            ...operation,
            transactionId,
          },
          tx,
        );
      }),
    );
  }

  async toUpdate(
    userId: UUID,
    operationData: { id: UUID; patch: EntryUpdateDTO }[],
    tx?: DataBase,
  ): Promise<OperationDbRow[]> {
    // TODO: add DTO validation
    return Promise.all(
      operationData.map(async ({ id, patch }) => {
        return this.operationRepository.update(userId, id, patch, tx);
      }),
    );
  }

  async toDelete(
    userId: UUID,
    operationIds: UUID[],
    tx?: DataBase,
  ): Promise<{ id: UUID; result: boolean }[]> {
    return Promise.all(
      operationIds.map(async (id) => {
        const result = await this.operationRepository.delete(userId, id, tx);
        return { id, result };
      }),
    );
  }

  applyForTransaction(
    _userId: UUID,
    _transactionId: UUID,
    _operationData: EntryApplyDTO[],
    _tx?: DataBase,
  ): Promise<{ createdIds: UUID[]; updatedIds: UUID[]; deletedIds: UUID[] }> {
    throw new Error('Method not implemented.');
  }

  sumLocalByTransactionId(
    operationData: Omit<OperationRepoInsert, 'userId' | 'isTombstone'>[],
  ) {
    return operationData.reduce((sum, op) => sum + op.localAmount, 0);
  }
}
