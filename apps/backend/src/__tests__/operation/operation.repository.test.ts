import {
  CategoryResponseDTO,
  AccountResponseDTO,
  UserDbRowDTO,
  TransactionDbRowDTO,
  OperationDBRowDTO,
  OperationInsertDTO,
  UUID,
} from '@ledgerly/shared/types';
import { TestDB } from 'src/db/test-db';
import { OperationRepository } from 'src/infrastructure/db/OperationRepository';
import { generateId } from 'src/libs/idGenerator';
import {
  ForeignKeyConstraintError,
  InvalidDataError,
} from 'src/presentation/errors';
import { DataBase } from 'src/types';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const createOperationData = (params: {
  accountId?: UUID;
  categoryId?: UUID;
  transactionId?: UUID;
  description?: string;
  userId?: UUID;
}): OperationInsertDTO => {
  return {
    accountId: params.accountId ?? generateId(),
    categoryId: params.categoryId ?? generateId(),
    description: 'Test Operation',
    hash: 'test-hash',
    id: generateId(),
    isTombstone: false,
    localAmount: 100,
    originalAmount: 100,
    transactionId: params.transactionId ?? generateId(),
    userId: params.userId ?? generateId(),
    ...params,
  };
};

const transactionTwoOperationOneDescription = 'Transaction Two Operation 1';
const transactionTwoOperationTwoDescription = 'Transaction Two Operation 2';
const transactionOneOperationOneDescription = 'Transaction One Operation 1';
const transactionOneOperationTwoDescription = 'Transaction One Operation 2';

const operationsDescriptions = [
  'Bulk Insert Operation 1',
  'Bulk Insert Operation 2',
  'Bulk Insert Operation 3',
];

describe('OperationRepository', () => {
  let operationRepository: OperationRepository;
  let testDB: TestDB;
  let testCategory: CategoryResponseDTO;
  let testAccount: AccountResponseDTO;
  let transaction1: TransactionDbRowDTO;
  let user: UserDbRowDTO;
  let insertedOperations: OperationDBRowDTO[];
  let transaction2: TransactionDbRowDTO;

  let operationsToInsert: OperationInsertDTO[];

  beforeEach(async () => {
    testDB = new TestDB();
    await testDB.setupTestDb();
    operationRepository = new OperationRepository(testDB.db);

    user = await testDB.createUser();

    testCategory = await testDB.createCategory(user.id);
    testAccount = await testDB.createAccount(user.id, {
      name: 'Test Account 1',
    });

    transaction1 = await testDB.createTransaction({
      data: {
        description: 'Test Transaction',
        postingDate: '2023-10-01',
        transactionDate: '2023-10-01',
      },
      userId: user.id,
    });

    const operationsToInsertPromises = [
      transactionOneOperationOneDescription,
      transactionOneOperationTwoDescription,
    ].map((description) => {
      const data = createOperationData({
        accountId: testAccount.id,
        categoryId: testCategory.id,
        description,
        transactionId: transaction1.id,
        userId: user.id,
      });

      return testDB.createOperation(data);
    });

    insertedOperations = await Promise.all(operationsToInsertPromises);

    operationsToInsert = operationsDescriptions.map((description) =>
      createOperationData({
        accountId: testAccount.id,
        categoryId: testCategory.id,
        description,
        transactionId: transaction1.id,
        userId: user.id,
      }),
    );

    transaction2 = await testDB.createTransaction({
      data: {
        description: 'Test Transaction 2',
        postingDate: '2023-10-01',
        transactionDate: '2023-10-01',
      },
      userId: user.id,
    });

    const transactionTwoOperationOneData = {
      accountId: testAccount.id,
      categoryId: testCategory.id,
      description: transactionTwoOperationOneDescription,
      transactionId: transaction2.id,
      userId: user.id,
    };

    const transactionTwoOperationTwoData = {
      accountId: testAccount.id,
      categoryId: testCategory.id,
      description: transactionTwoOperationTwoDescription,
      transactionId: transaction2.id,
      userId: user.id,
    };

    await Promise.all([
      testDB.createOperation(transactionTwoOperationOneData),
      testDB.createOperation(transactionTwoOperationTwoData),
    ]);
  });

  describe('getByTransactionId', () => {
    it('should return operations for a given transaction ID', async () => {
      const transactionOneOperations =
        await operationRepository.getByTransactionId(transaction1.id);

      expect(transactionOneOperations).toHaveLength(insertedOperations.length);

      transactionOneOperations.forEach((operation, index) => {
        expect(operation).toMatchObject({
          description: insertedOperations[index].description,
          transactionId: transaction1.id,
          userId: user.id,
        });
      });

      [
        transactionTwoOperationOneDescription,
        transactionTwoOperationTwoDescription,
      ].forEach((description) => {
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
        testDB.db,
      );

      expect(operations).toHaveLength(operationsToInsert.length);

      operations.forEach((operation, index) => {
        const match = operationsToInsert[index];

        expect(operation).toMatchObject({
          accountId: match.accountId,
          categoryId: match.categoryId,
          description: match.description,
          hash: match.hash,
          id: match.id,
          isTombstone: match.isTombstone,
          localAmount: match.localAmount,
          originalAmount: match.originalAmount,
          transactionId: transaction1.id,
          userId: user.id,
        });
      });

      const allOperations = await operationRepository.getByTransactionId(
        transaction1.id,
      );

      expect(allOperations).toHaveLength(
        insertedOperations.length + operationsToInsert.length,
      );
    });

    it('should use a transaction if provided', async () => {
      const mock = vi.fn();

      const tx = {
        insert: () => ({
          values: (operations: unknown) => {
            mock(operations);

            return {
              returning: vi.fn,
            };
          },
        }),
      } as unknown as DataBase;

      await operationRepository.bulkInsert(operationsToInsert, tx);

      expect(mock).toHaveBeenCalledWith(operationsToInsert);
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
      const operations = operationRepository.bulkInsert([], testDB.db);

      await expect(operations).rejects.toThrow(InvalidDataError);
    });

    it('should handle invalid operation data', async () => {
      const invalidOperationData = createOperationData({
        description: 'Test',
      });

      const operations = operationRepository.bulkInsert(
        [invalidOperationData],
        testDB.db,
      );

      await expect(operations).rejects.toThrow(ForeignKeyConstraintError);
    });
  });

  describe('deleteByTransactionId', () => {
    it('should delete operations by transaction ID', async () => {
      const operationsBeforeDeleting =
        await testDB.getOperationsByTransactionId(transaction1.id);

      const deleteResult = await operationRepository.deleteByTransactionId(
        transaction1.id,
      );

      const operationsAfterDeleting = await testDB.getOperationsByTransactionId(
        transaction1.id,
      );

      expect(operationsBeforeDeleting).toHaveLength(insertedOperations.length);
      expect(deleteResult).toEqual(insertedOperations.length);

      expect(operationsAfterDeleting).toHaveLength(0);
    });

    it('should not throw an error if no operations found for transaction ID', async () => {
      const nonExistentTransactionId = generateId();

      const deleteResult = await operationRepository.deleteByTransactionId(
        nonExistentTransactionId,
      );

      expect(deleteResult).toEqual(0);

      await expect(
        operationRepository.deleteByTransactionId(nonExistentTransactionId),
      ).resolves.not.toThrow();
    });

    it('should not affect operations of other transactions', async () => {
      const allOperationsBeforeDeleting = await testDB.getAllOperations();

      const filteredOperationsBeforeDeletingIds = new Set(
        allOperationsBeforeDeleting
          .filter((op) => op.transactionId !== transaction1.id)
          .map((op) => op.id),
      );

      const operationsBeforeDeleting =
        await testDB.getOperationsByTransactionId(transaction2.id);

      const deleteResult = await operationRepository.deleteByTransactionId(
        transaction1.id,
      );

      const operationsAfterDeleting = await testDB.getOperationsByTransactionId(
        transaction2.id,
      );

      expect(deleteResult).toEqual(insertedOperations.length);

      expect(operationsAfterDeleting).toHaveLength(
        operationsBeforeDeleting.length,
      );

      const transactionTwoOperations =
        await operationRepository.getByTransactionId(transaction2.id);

      expect(transactionTwoOperations).toHaveLength(2);

      expect(
        transactionTwoOperations.some(
          (op) =>
            op.description === transactionTwoOperationOneDescription ||
            op.description === transactionTwoOperationTwoDescription,
        ),
      ).toBe(true);

      transactionTwoOperations.forEach((operation) => {
        expect(filteredOperationsBeforeDeletingIds.has(operation.id)).toBe(
          true,
        );
      });
    });
  });
});
