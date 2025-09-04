import {
  UserDbRowDTO,
  UUID,
  AccountDomain,
  IsoDatetimeString,
  Sha256String,
  PerIdStatus,
} from '@ledgerly/shared/types';
import {
  OperationDbInsert,
  OperationDbRow,
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
}): OperationRepoInsert => {
  return {
    accountId: params.accountId ?? generateId(),
    baseAmount: 100,
    description: 'Test Operation',
    hash: `hash-${Math.random().toString(36).substring(2, 15)}`,
    isTombstone: false,
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
  let testAccount: AccountDomain;
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

    testAccount = await testDB.createAccount(user1.id, {
      name: 'Test Account 1',
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
        accountId: testAccount.id,
        description: description.description,
        transactionId: description.transactionId,
        userId: user1.id,
      });

      return testDB.createOperation(data);
    });

    insertedOperations = await Promise.all(operationsToInsertPromises);

    operationsToInsert = operationsDescriptions.map((description) =>
      createOperationData({
        accountId: testAccount.id,
        description,
        transactionId: transaction1.id,
        userId: user1.id,
      }),
    );
  });

  describe('getByTransactionId', () => {
    it('should return operations for a given transaction ID', async () => {
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

  describe('bulkInsert', () => {
    it('should add a bulk of operations', async () => {
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
          hash: match.hash,
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
          hash: expect.any(String) as unknown as Sha256String,
          id: expect.any(String) as unknown as UUID,
          transactionId: operationsToInsert[0].transactionId,
          updatedAt: expect.any(String) as unknown as IsoDatetimeString,
          userId: operationsToInsert[0].userId,
        }),
      );
    });

    it('should throw an error if bulk insert fails', async () => {
      vi.spyOn(testDB.db, 'insert').mockImplementationOnce(() => {
        throw new Error('Database error');
      });

      await expect(
        operationRepository.bulkInsert(operationsToInsert),
      ).rejects.toThrow('Failed to bulk insert operations');
    });

    it('should handle empty operations array', async () => {
      const operations = await operationRepository.bulkInsert(
        [],
        testDB.db as unknown as TxType,
      );

      expect(operations).toHaveLength(0);
    });

    it('should handle invalid operation data', async () => {
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

  describe('bulkSoftDeleteByIds', () => {
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
          hash: operationBeforeDeleting?.hash,
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

    it.skip('should not throw an error if no operations found for transaction ID', async () => {
      const nonExistentTransactionId = generateId();

      const deleteResult = await operationRepository.deleteByTransactionId(
        nonExistentTransactionId,
      );

      expect(deleteResult).toEqual(0);

      await expect(
        operationRepository.deleteByTransactionId(nonExistentTransactionId),
      ).resolves.not.toThrow();
    });

    // it.skip('should not affect operations of other transactions', async () => {
    //   const allOperationsBeforeDeleting = await testDB.getAllOperations();

    //   const filteredOperationsBeforeDeletingIds = new Set(
    //     allOperationsBeforeDeleting
    //       .filter((op) => op.transactionId !== transaction1.id)
    //       .map((op) => op.id),
    //   );

    //   const operationsBeforeDeleting =
    //     await testDB.getOperationsByTransactionId(transaction2.id);

    //   const deleteResult = await operationRepository.deleteByTransactionId(
    //     transaction1.id,
    //   );

    //   const operationsAfterDeleting = await testDB.getOperationsByTransactionId(
    //     transaction2.id,
    //   );

    //   expect(deleteResult).toEqual(insertedOperations.length);

    //   expect(operationsAfterDeleting).toHaveLength(
    //     operationsBeforeDeleting.length,
    //   );

    //   const transactionTwoOperations =
    //     await operationRepository.getByTransactionId(transaction2.id);

    //   expect(transactionTwoOperations).toHaveLength(2);

    //   expect(
    //     transactionTwoOperations.some(
    //       (op) =>
    //         op.description === transactionTwoOperationOneDescription ||
    //         op.description === transactionTwoOperationTwoDescription,
    //     ),
    //   ).toBe(true);

    //   transactionTwoOperations.forEach((operation) => {
    //     expect(filteredOperationsBeforeDeletingIds.has(operation.id)).toBe(
    //       true,
    //     );
    //   });
    // });
  });
});
