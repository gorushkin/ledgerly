import {
  IsoDatetimeString,
  Money,
  EntryCreateDTO,
} from '@ledgerly/shared/types';
import { OperationDbRow, OperationRepoInsert } from 'src/db/schema';
import { OperationRepository } from 'src/infrastructure/db/OperationRepository';
import { OperationService } from 'src/services/operation.service';
import { DataBase } from 'src/types';
import { describe, expect, it, vi } from 'vitest';

describe('OperationService', () => {
  const operationRepository = {
    create: vi.fn(),
    delete: vi.fn(),
    listByTransactionId: vi.fn(),
    update: vi.fn(),
  };

  const userId = 'user-id';
  const transactionId = 'transaction-id';

  const operationService = new OperationService(
    operationRepository as unknown as OperationRepository,
  );

  const mockTx = { id: 'mock-transaction' };

  const db = {
    transaction: vi
      .fn()
      .mockImplementation(async (callback: (db: unknown) => Promise<void>) => {
        return await callback(mockTx);
      }),
  } as unknown as DataBase;

  describe('listByTransactionId', () => {
    it('should call the repository method with the correct transaction ID and user ID', async () => {
      await operationService.listByTransactionId(userId, transactionId);

      expect(operationRepository.listByTransactionId).toHaveBeenCalledWith(
        userId,
        transactionId,
      );
    });
  });

  describe('toInsert', () => {
    it('should call the repository method with the correct transaction ID, user ID, operationData', async () => {
      const operationRepoInsertData_1: OperationRepoInsert = {
        accountId: 'account-id',
        amount: 100 as Money,
        description: 'Wallet expense',
        transactionId,
      };

      const operationRepoInsertData_2: OperationRepoInsert = {
        accountId: 'account-id',
        amount: -100 as Money,
        description: 'Test Operation',
        transactionId,
      };

      const operationRepoInsertData = [
        operationRepoInsertData_1,
        operationRepoInsertData_2,
      ];

      const operationDbRowData_1: OperationDbRow = {
        id: 'new-operation-id1',
        ...operationRepoInsertData_1,
        createdAt: expect.any(Date) as IsoDatetimeString,
        description: 'Test Operation1',
        isTombstone: false,
        updatedAt: expect.any(Date) as IsoDatetimeString,
        userId,
      };

      const operationDbRowData_2: OperationDbRow = {
        id: 'new-operation-id2',
        ...operationRepoInsertData_2,
        createdAt: expect.any(Date) as IsoDatetimeString,
        description: 'Test Operation2',
        isTombstone: false,
        updatedAt: expect.any(Date) as IsoDatetimeString,
        userId,
      };

      const operationDbRowData = [operationDbRowData_1, operationDbRowData_2];

      operationDbRowData.forEach((op) => {
        operationRepository.create.mockResolvedValueOnce(op);
      });

      const insertOperationData = operationRepoInsertData.map((item) => ({
        ...item,
        description: item.description ?? '',
      }));

      const result = await operationService.toInsert(
        userId,
        transactionId,
        insertOperationData,
        db,
      );

      expect(operationRepository.create).toHaveBeenCalledTimes(
        operationRepoInsertData.length,
      );

      operationRepoInsertData.forEach((data, index) => {
        expect(operationRepository.create).toHaveBeenNthCalledWith(
          index + 1,
          userId,
          {
            ...data,
            amount: data.amount,
            description: data.description ?? '',
          },
          db,
        );
      });

      result.forEach((op) => {
        expect(op.id).toBeDefined();
        expect(op.createdAt).toBeDefined();
        expect(op.updatedAt).toBeDefined();
        expect(op.isTombstone).toBe(false);
        expect(op.userId).toBe(userId);
        expect(op.transactionId).toMatch(transactionId);
      });

      expect(result).toEqual(operationDbRowData);
    });

    it.skip('should create extra operations if operations have different currencies', async () => {
      const operation_1: EntryCreateDTO = {
        accountId: 'usd wallet account-id',
        amount: 500 as Money,
        description: 'Wallet expense',
      };

      const operation_2: EntryCreateDTO = {
        accountId: 'usd fuel account-id',
        amount: 400 as Money,
        description: 'Bank income',
      };

      const operation_3: EntryCreateDTO = {
        accountId: 'rub fuel account-id',
        amount: 10000 as Money,
        description: 'Bank income',
      };

      const items = [operation_1, operation_2, operation_3];

      const result = await operationService.toInsert(
        userId,
        transactionId,
        items,
        db,
      );

      console.log('result: ', result);
    });
  });

  // describe.skip('toUpdate', () => {
  //   it('should call the repository method with the correct transaction ID, user ID, operationData', async () => {
  //     operationDbRowData.forEach((op) => {
  //       operationRepository.update.mockResolvedValueOnce(op);
  //     });

  //     const result = await operationService.toUpdate(
  //       userId,
  //       operationRepoInsertData,
  //       db,
  //     );

  //     expect(operationRepository.update).toHaveBeenCalledTimes(
  //       operationRepoInsertData.length,
  //     );

  //     operationRepoInsertData.forEach((data, index) => {
  //       expect(operationRepository.update).toHaveBeenNthCalledWith(
  //         index + 1,
  //         userId,
  //         data,
  //         db,
  //       );
  //     });

  //     result.forEach((op) => {
  //       expect(op.id).toBeDefined();
  //       expect(op.createdAt).toBeDefined();
  //       expect(op.updatedAt).toBeDefined();
  //       expect(op.isTombstone).toBe(false);
  //       expect(op.userId).toBe(userId);
  //       expect(op.transactionId).toMatch(transactionId);
  //     });

  //     expect(result).toEqual(operationDbRowData);
  //   });
  // });

  // describe.skip('toDelete', () => {
  //   it('should call the repository method with the correct transaction ID, user ID, operationData', async () => {
  //     operationDbRowData.forEach(() => {
  //       operationRepository.delete.mockResolvedValueOnce(true);
  //     });

  //     const result = await operationService.toDelete(userId, operationIds, db);

  //     expect(operationRepository.delete).toHaveBeenCalledTimes(
  //       operationIds.length,
  //     );

  //     operationIds.forEach((id, index) => {
  //       expect(operationRepository.delete).toHaveBeenNthCalledWith(
  //         index + 1,
  //         userId,
  //         id,
  //         db,
  //       );
  //     });

  //     result.forEach((op) => {
  //       expect(op.id).toBeDefined();
  //       expect(op.result).toBe(true);
  //     });

  //     const expectedResult = operationIds.map((id) => ({ id, result: true }));

  //     expect(result).toEqual(expectedResult);
  //   });
  // });
});
