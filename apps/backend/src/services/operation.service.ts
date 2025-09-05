import { UUID } from '@ledgerly/shared/types';
import { OperationRepoInsert } from 'src/db/schemas/operations';
import { OperationRepository } from 'src/infrastructure/db/OperationRepository';

import { BaseService } from './baseService';

export class OperationService extends BaseService {
  constructor(private readonly operationRepository: OperationRepository) {
    super();
  }

  async listByTransactionId(userId: UUID, transactionId: UUID) {
    return this.operationRepository.listByTransactionId(userId, transactionId);
  }

  async toInsert(
    userId: UUID,
    operationData: Omit<OperationRepoInsert, 'userId' | 'isTombstone'>,
    tx?: unknown,
  ) {
    console.log('userId: ', userId);
    console.log('operationData: ', operationData);
  }
}
