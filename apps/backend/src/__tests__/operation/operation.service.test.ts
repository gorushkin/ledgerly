import { OperationRepoInsert } from 'src/db/schema';
import { OperationRepository } from 'src/infrastructure/db/OperationRepository';
import { OperationService } from 'src/services/operation.service';
import { describe, expect, it, vi } from 'vitest';

describe('OperationService', () => {
  const operationRepository = {
    create: vi.fn(),
    getByTransactionId: vi.fn(),
  };

  const operationService = new OperationService(
    operationRepository as unknown as OperationRepository,
  );

  describe('listByTransactionId', () => {
    it('should call the repository method with the correct transaction ID and user ID', async () => {
      const userId = 'user-id';
      const transactionId = 'transaction-id';

      await operationService.listByTransactionId(userId, transactionId);

      expect(operationRepository.getByTransactionId).toHaveBeenCalledWith(
        userId,
        transactionId,
      );
    });
  });

  describe('toInsert', () => {
    it('should call the repository method with the correct transaction ID, user ID, operationData', async () => {
      const userId = 'user-id';
      const operationData1: OperationRepoInsert = {
        accountId: 'account-id',
        baseAmount: 100,
        description: 'Test Operation',
        isTombstone: false,
        localAmount: 100,
        rateBasePerLocal: 1,
        transactionId: 'transaction-id',
        userId: 'user-id',
      };

      const operationData2: OperationRepoInsert = {
        accountId: 'account-id',
        baseAmount: 100,
        description: 'Test Operation',
        isTombstone: false,
        localAmount: 100,
        rateBasePerLocal: 1,
        transactionId: 'transaction-id',
        userId: 'user-id',
      };

      const promises = [operationData1, operationData2].map((data) => {
        return operationService.toInsert(userId, data);
      });

      await Promise.all(promises);

      expect(operationRepository.create).toHaveBeenCalledWith(
        userId,
        operationData1,
      );
    });
  });
});
