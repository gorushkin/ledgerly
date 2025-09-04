import {
  UserDbRowDTO,
  UUID,
  AccountDomain,
  IsoDatetimeString,
  PerIdStatus,
} from '@ledgerly/shared/types';
import {
  OperationDbInsert,
  OperationDbRow,
  OperationDbUpdate,
  OperationRepoInsert,
  TransactionDbRow,
} from 'src/db/schema';
import { TestDB } from 'src/db/test-db';
import { OperationRepository } from 'src/infrastructure/db/OperationRepository';
import { generateId } from 'src/libs/idGenerator';
import { ForeignKeyConstraintError } from 'src/presentation/errors';
import { TxType } from 'src/types';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const createOperationData = (params: {
  accountId?: UUID;
  categoryId?: UUID;
  transactionId?: UUID;
  description?: string;
  userId?: UUID;
  isTombstone?: boolean;
}): OperationRepoInsert => {
  return {
    accountId: params.accountId ?? generateId(),
    baseAmount: 100,
    description: 'Test Operation',
    isTombstone: !!params.isTombstone,
    localAmount: 100,
    rateBasePerLocal: 200,
    transactionId: params.transactionId ?? generateId(),
    userId: params.userId ?? generateId(),
    ...params,
  };
};

const transaction_2_1 = 'Transaction Two Operation 1';
const transaction_2_2 = 'Transaction Two Operation 2';
const transaction_1_1 = 'Transaction One Operation 1';
const transaction_1_2 = 'Transaction One Operation 2';

const operationsDescriptions = [
  'Bulk Insert Operation 1',
  'Bulk Insert Operation 2',
  'Bulk Insert Operation 3',
];

describe('OperationRepository', () => {
  let operationRepository: OperationRepository;
  let testDB: TestDB;
  let testAccount1: AccountDomain;
  let testAccount2: AccountDomain;
  let transaction1: TransactionDbRow;
  let user1: UserDbRowDTO;
  let insertedOperations: OperationDbRow[];
  let transaction2: TransactionDbRow;

  let operationsToInsert: Omit<
    OperationDbInsert,
    'createdAt' | 'updatedAt' | 'id'
  >[];

  beforeEach(async () => {
    testDB = new TestDB();
    await testDB.setupTestDb();
    operationRepository = new OperationRepository(testDB.db);

    user1 = await testDB.createUser();

    testAccount1 = await testDB.createAccount(user1.id, {
      name: 'Test Account 1',
    });

    testAccount2 = await testDB.createAccount(user1.id, {
      name: 'Test Account 2',
    });

    transaction1 = await testDB.createTransaction({
      description: 'Test Transaction',
      userId: user1.id,
    });

    transaction2 = await testDB.createTransaction({
      description: 'Test Transaction 2',
      userId: user1.id,
    });

    const operationsData: { description: string; transactionId: string }[] = [
      {
        description: transaction_1_1,
        transactionId: transaction1.id,
      },
      {
        description: transaction_1_2,
        transactionId: transaction1.id,
      },
      {
        description: transaction_2_1,
        transactionId: transaction2.id,
      },
      {
        description: transaction_2_2,
        transactionId: transaction2.id,
      },
    ];

    const operationsToInsertPromises = operationsData.map((description) => {
      const data = createOperationData({
        accountId: testAccount1.id,
        description: description.description,
        transactionId: description.transactionId,
        userId: user1.id,
      });

      return testDB.createOperation(data);
    });

    insertedOperations = await Promise.all(operationsToInsertPromises);

    operationsToInsert = operationsDescriptions.map((description) =>
      createOperationData({
        accountId: testAccount1.id,
        description,
        transactionId: transaction1.id,
        userId: user1.id,
      }),
    );
  });

  describe('getByTransactionId', () => {
    it.skip('should return operations for a given transaction ID', async () => {
      const transactionOneOperations =
        await operationRepository.getByTransactionId(transaction1.id);

      expect(transactionOneOperations).toHaveLength(
        insertedOperations.filter((op) => op.transactionId === transaction1.id)
          .length,
      );

      transactionOneOperations.forEach((operation, index) => {
        expect(operation).toMatchObject({
          description: insertedOperations[index].description,
          transactionId: transaction1.id,
          userId: user1.id,
        });
      });

      [transaction_2_1, transaction_2_2].forEach((description) => {
        expect(
          transactionOneOperations.some((op) => op.description === description),
        ).toBe(false);
      });
    });
  });

  describe.skip('bulkInsert', () => {
    it.skip('should add a bulk of operations', async () => {
      const operations = await operationRepository.bulkInsert(
        operationsToInsert,
        testDB.db as unknown as TxType,
      );

      expect(operations).toHaveLength(operationsToInsert.length);

      operations.forEach((operation, index) => {
        const match = operationsToInsert[index];

        expect(operation).toMatchObject({
          accountId: match.accountId,
          baseAmount: match.baseAmount,
          description: match.description,
          isTombstone: match.isTombstone,
          localAmount: match.localAmount,
          transactionId: transaction1.id,
          userId: user1.id,
        });
      });

      const allOperations = await operationRepository.getByTransactionId(
        transaction1.id,
      );

      expect(allOperations).toHaveLength(
        insertedOperations.filter((op) => op.transactionId === transaction1.id)
          .length + operationsToInsert.length,
      );
    });

    it.skip('should use a transaction if provided', async () => {
      const mock = vi.fn();
      let capturedValues = [] as unknown[];
      const returningFn = vi.fn(async () => Promise.resolve(capturedValues));
      const dbInsertSpy = vi.spyOn(operationRepository.db, 'insert');

      const valuesFn = vi.fn((vals: unknown[]) => {
        capturedValues = vals;
        mock(vals);
        return { returning: returningFn } as const;
      });

      const insertFn = vi.fn((_table: unknown) => ({ values: valuesFn }));

      const tx = { insert: insertFn } as unknown as TxType;

      const result = await operationRepository.bulkInsert(
        operationsToInsert,
        tx,
      );

      expect(dbInsertSpy).toHaveBeenCalledTimes(0);
      expect(insertFn).toHaveBeenCalledTimes(1);
      expect(valuesFn).toHaveBeenCalledTimes(1);
      expect(returningFn).toHaveBeenCalledTimes(1);
      expect(mock).toHaveBeenCalledWith(capturedValues);
      expect(result).toBe(capturedValues);

      const first = capturedValues[0] as OperationDbRow;

      expect(first).toEqual(
        expect.objectContaining({
          accountId: operationsToInsert[0].accountId,
          createdAt: expect.any(String) as unknown as IsoDatetimeString,
          description: operationsToInsert[0].description,
          id: expect.any(String) as unknown as UUID,
          transactionId: operationsToInsert[0].transactionId,
          updatedAt: expect.any(String) as unknown as IsoDatetimeString,
          userId: operationsToInsert[0].userId,
        }),
      );
    });

    it.skip('should throw an error if bulk insert fails', async () => {
      vi.spyOn(testDB.db, 'insert').mockImplementationOnce(() => {
        throw new Error('Database error');
      });

      await expect(
        operationRepository.bulkInsert(operationsToInsert),
      ).rejects.toThrow('Failed to bulk insert operations');
    });

    it.skip('should handle empty operations array', async () => {
      const operations = await operationRepository.bulkInsert(
        [],
        testDB.db as unknown as TxType,
      );

      expect(operations).toHaveLength(0);
    });

    it.skip('should handle invalid operation data', async () => {
      const invalidOperationData = createOperationData({
        description: 'Test',
      });

      const operations = operationRepository.bulkInsert(
        [invalidOperationData],
        testDB.db as unknown as TxType,
      );

      await expect(operations).rejects.toThrow(ForeignKeyConstraintError);
    });
  });

  describe.skip('bulkSoftDeleteByIds', () => {
    it('should soft delete operations by ids', async () => {
      const operationsBeforeDeleting =
        await testDB.getOperationsByTransactionId(transaction1.id);

      const operationsIdsToDelete = operationsBeforeDeleting.map((op) => op.id);

      const result = await operationRepository.bulkSoftDeleteByIds(
        operationsIdsToDelete,
      );

      const outcome = operationsIdsToDelete.reduce(
        (acc, id) => {
          acc[id] = 'deleted';
          return acc;
        },
        {} as Record<string, PerIdStatus>,
      );

      expect(result).toMatchObject({
        changed: operationsIdsToDelete.length,
        notFoundIds: [],
        outcome,
        requestedIds: operationsIdsToDelete,
      });

      const deletedOperations = await Promise.all(
        operationsIdsToDelete.map((id) => testDB.getOperationById(id)),
      );

      expect(deletedOperations).toHaveLength(operationsIdsToDelete.length);

      deletedOperations.forEach((deletedOperation, index) => {
        const operationBeforeDeleting = operationsBeforeDeleting[index];

        expect(deletedOperation).toMatchObject({
          accountId: operationBeforeDeleting?.accountId,
          baseAmount: operationBeforeDeleting?.baseAmount,
          createdAt: operationBeforeDeleting?.createdAt,
          description: operationBeforeDeleting?.description,
          isTombstone: true,
          localAmount: operationBeforeDeleting?.localAmount,
          rateBasePerLocal: operationBeforeDeleting?.rateBasePerLocal,
          transactionId: operationBeforeDeleting?.transactionId,
          userId: operationBeforeDeleting?.userId,
        });

        expect(operationBeforeDeleting?.updatedAt).not.toEqual(
          deletedOperation?.updatedAt,
        );
      });
    });
  });

  describe.skip('bulkRestoreByIds', () => {
    it('should restore operations by ids', async () => {
      const transaction3 = await testDB.createTransaction({
        description: 'Test Transaction 3',
        userId: user1.id,
      });

      const operationsData: { description: string; transactionId: string }[] = [
        {
          description: transaction_2_1,
          transactionId: transaction3.id,
        },
        {
          description: transaction_2_2,
          transactionId: transaction3.id,
        },
      ];

      const operationsToInsertPromises = operationsData.map((description) => {
        const data = createOperationData({
          accountId: testAccount1.id,
          description: description.description,
          isTombstone: true,
          transactionId: description.transactionId,
          userId: user1.id,
        });

        return testDB.createOperation(data);
      });

      const createdOperations = await Promise.all(operationsToInsertPromises);

      const operationsBeforeRestoring =
        await testDB.getOperationsByTransactionId(transaction3.id);

      const operationsIdsToRestore = operationsBeforeRestoring.map(
        (op) => op.id,
      );

      const result = await operationRepository.bulkRestoreByIds(
        operationsIdsToRestore,
      );

      const outcome = operationsIdsToRestore.reduce(
        (acc, id) => {
          acc[id] = 'restored';
          return acc;
        },
        {} as Record<string, PerIdStatus>,
      );

      expect(result).toMatchObject({
        changed: createdOperations.length,
        notFoundIds: [],
        outcome,
        requestedIds: operationsIdsToRestore,
      });

      const restoredOperations = await Promise.all(
        operationsIdsToRestore.map((id) => testDB.getOperationById(id)),
      );

      expect(restoredOperations).toHaveLength(operationsIdsToRestore.length);

      restoredOperations.forEach((restoredOperation, index) => {
        const operationBeforeDeleting = operationsBeforeRestoring[index];

        expect(restoredOperation).toMatchObject({
          accountId: operationBeforeDeleting?.accountId,
          baseAmount: operationBeforeDeleting?.baseAmount,
          createdAt: operationBeforeDeleting?.createdAt,
          description: operationBeforeDeleting?.description,
          isTombstone: false,
          localAmount: operationBeforeDeleting?.localAmount,
          rateBasePerLocal: operationBeforeDeleting?.rateBasePerLocal,
          transactionId: operationBeforeDeleting?.transactionId,
          userId: operationBeforeDeleting?.userId,
        });

        expect(operationBeforeDeleting?.updatedAt).not.toEqual(
          restoredOperation?.updatedAt,
        );
      });
    });
  });

  describe('create', () => {
    it('should create operation', async () => {
      const newOperation = createOperationData({
        accountId: testAccount1.id,
        description: 'New Operation',
        isTombstone: false,
        transactionId: transaction1.id,
        userId: user1.id,
      });

      const createdOperation = await operationRepository.create(
        user1.id,
        newOperation,
      );

      expect(createdOperation).toBeDefined();
      expect(createdOperation).toMatchObject(newOperation);
    });
  });

  describe('update', () => {
    it('should update operation', async () => {
      const operationToUpdate = insertedOperations[0];

      const patch: OperationDbUpdate = {
        accountId: testAccount2.id,
        baseAmount: 600,
        description: 'Updated Description',
        localAmount: 500,
        rateBasePerLocal: 1.2,
      };

      const updatedOperation = await operationRepository.update(
        user1.id,
        operationToUpdate.id,
        patch,
      );

      expect(updatedOperation).toBeDefined();
      expect(updatedOperation).toMatchObject({
        accountId: patch.accountId,
        baseAmount: patch.baseAmount,
        createdAt: operationToUpdate.createdAt,
        description: patch.description,
        id: operationToUpdate.id,
        localAmount: patch.localAmount,
        rateBasePerLocal: patch.rateBasePerLocal,
        transactionId: operationToUpdate.transactionId,
        updatedAt: expect.any(String) as unknown as IsoDatetimeString,
        userId: operationToUpdate.userId,
      });
    });

    it('should not update restricted fields', async () => {
      const operationToUpdate = insertedOperations[0];

      const patch: OperationDbUpdate = {
        accountId: testAccount2.id,
        baseAmount: 600,
        createdAt: '2023-01-01T00:00:00.000Z' as IsoDatetimeString,
        description: 'Updated Description',
        id: generateId(),
        isTombstone: true,
        localAmount: 500,
        rateBasePerLocal: 1.2,
        transactionId: generateId(),
        updatedAt: '2023-01-01T00:00:00.000Z' as IsoDatetimeString,
        userId: generateId(),
      } as unknown as OperationDbUpdate;

      const updatedOperation = await operationRepository.update(
        user1.id,
        operationToUpdate.id,
        patch,
      );

      expect(updatedOperation).toBeDefined();
      expect(updatedOperation).toMatchObject({
        accountId: patch.accountId,
        baseAmount: patch.baseAmount,
        createdAt: operationToUpdate.createdAt,
        description: patch.description,
        id: operationToUpdate.id,
        isTombstone: operationToUpdate.isTombstone,
        localAmount: patch.localAmount,
        rateBasePerLocal: patch.rateBasePerLocal,
        transactionId: operationToUpdate.transactionId,
        updatedAt: expect.any(String) as unknown as IsoDatetimeString,
        userId: operationToUpdate.userId,
      });
    });
  });

  describe('delete', () => {
    it('should soft delete operation', async () => {
      const operationToDelete = insertedOperations[0];

      expect(operationToDelete.isTombstone).toBe(false);

      const result = await operationRepository.delete(
        user1.id,
        operationToDelete.id,
      );

      expect(result).toBe(true);

      const deletedOperation = await testDB.getOperationById(
        operationToDelete.id,
      );

      expect(deletedOperation).toMatchObject({
        accountId: operationToDelete.accountId,
        baseAmount: operationToDelete.baseAmount,
        createdAt: operationToDelete.createdAt,
        description: operationToDelete.description,
        id: operationToDelete.id,
        isTombstone: true,
        localAmount: operationToDelete.localAmount,
        rateBasePerLocal: operationToDelete.rateBasePerLocal,
        transactionId: operationToDelete.transactionId,
        updatedAt: expect.any(String) as unknown as IsoDatetimeString,
        userId: operationToDelete.userId,
      });
    });
  });

  describe('restore', () => {
    it('should restore operation', async () => {
      const operationToRestore = await testDB.createOperation({
        accountId: testAccount1.id,
        description: 'To be restored',
        isTombstone: true,
        rateBasePerLocal: 200,
        transactionId: transaction1.id,
        userId: user1.id,
      });

      expect(operationToRestore.isTombstone).toBe(true);

      const result = await operationRepository.restore(
        user1.id,
        operationToRestore.id,
      );

      expect(result).toBe(true);

      const restoredOperation = await testDB.getOperationById(
        operationToRestore.id,
      );

      expect(restoredOperation).toMatchObject({
        accountId: operationToRestore.accountId,
        baseAmount: operationToRestore.baseAmount,
        createdAt: operationToRestore.createdAt,
        description: operationToRestore.description,
        id: operationToRestore.id,
        isTombstone: false,
        localAmount: operationToRestore.localAmount,
        rateBasePerLocal: operationToRestore.rateBasePerLocal,
        transactionId: operationToRestore.transactionId,
        updatedAt: expect.any(String) as unknown as IsoDatetimeString,
        userId: operationToRestore.userId,
      });
    });
  });
});
