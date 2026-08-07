import { UUID } from '@ledgerly/shared/types';
import { OperationDbRow, operationsTable, UserDbRow } from 'src/db/schema';
import {
  compareEntities,
  TransactionBuilder,
  TransactionBuilderResult,
} from 'src/db/test-utils';
import { Transaction } from 'src/domain';
import { Amount, Timestamp } from 'src/domain/domain-core';
import { OperationSnapshot } from 'src/domain/operations/types';
import {
  ForeignKeyConstraintError,
  RepositoryInvariantError,
} from 'src/infrastructure/errors';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { TestDB } from '../../../db/test-db';
import { AccountPersistenceMapper } from '../accounts';
import { CommodityPersistenceMapper } from '../commodities';
import { TransactionManager } from '../TransactionManager';
import { UserPersistenceMapper } from '../user';

import { OperationPersistenceMapper } from './operation-persistence.mapper';
import { OperationRepository } from './operation.repository';

describe('OperationRepository', () => {
  let testDB: TestDB;
  let userSnapshot: UserDbRow;

  let transaction: Transaction;

  let data: TransactionBuilderResult;

  const transactionManager = {
    getCurrentTransaction: () => testDB.db,
    run: vi.fn((cb: () => unknown) => {
      return cb();
    }),
  };

  const operationRepository = new OperationRepository(
    transactionManager as unknown as TransactionManager,
  );

  beforeEach(async () => {
    testDB = new TestDB();
    await testDB.setupTestDb();
    userSnapshot = await testDB.createUser();

    const operationsData = [
      { accountKey: 'USD', amount: '10000', description: '1' },
      { accountKey: 'EUR', amount: '-10000', description: '2' },
      { accountKey: 'USD', amount: '20000', description: '1' },
      { accountKey: 'USD', amount: '-20000', description: '2' },
      { accountKey: 'USD', amount: '20000', description: '1' },
      { accountKey: 'USD', amount: '-20000', description: '2' },
    ];

    data = TransactionBuilder.transaction({
      currencies: ['USD', 'EUR'],
      operations: operationsData,
      user: UserPersistenceMapper.toDomain(userSnapshot),
    });

    transaction = data.transaction;

    await Promise.all(
      data.commodities.map((commodity) =>
        testDB.insertCommodity(
          CommodityPersistenceMapper.toDBRowFromSnapshot(
            commodity.toSnapshot(),
          ),
        ),
      ),
    );

    await Promise.all(
      data.accounts.map((account) =>
        testDB.insertAccount(
          AccountPersistenceMapper.toDBRowFromSnapshot(account.toSnapshot()),
        ),
      ),
    );

    await testDB.insertTransaction({
      ...transaction.toSnapshot(),
      operations: [],
    });
  });

  describe('existsActiveByAccountId', () => {
    it('should return true when the account has an active operation', async () => {
      const operation = OperationPersistenceMapper.toDBRow(data.operations[0]);

      await testDB.insertOperation(operation);

      await expect(
        operationRepository.existsActiveByAccountId(
          userSnapshot.id,
          operation.accountId,
        ),
      ).resolves.toBe(true);
    });

    it('should return false when matching operations are tombstoned', async () => {
      const operation = OperationPersistenceMapper.toDBRow(data.operations[0]);

      await testDB.insertOperation({
        ...operation,
        isTombstone: true,
      });

      await expect(
        operationRepository.existsActiveByAccountId(
          userSnapshot.id,
          operation.accountId,
        ),
      ).resolves.toBe(false);
    });

    it('should return false when only another user has an active operation', async () => {
      const otherUser = await testDB.createUser({
        email: `other-${Date.now()}@example.com`,
      });
      const otherCommodity = await testDB.createCommodity(otherUser.id);
      const otherAccount = await testDB.createAccount(
        otherUser.id,
        otherCommodity.id,
      );
      const otherTransaction = await testDB.createTransaction(
        otherUser.id,
        otherCommodity.id,
      );

      await testDB.createOperation(otherUser.id, {
        accountId: otherAccount.id,
        transactionId: otherTransaction.id,
      });

      await expect(
        operationRepository.existsActiveByAccountId(
          userSnapshot.id,
          otherAccount.id,
        ),
      ).resolves.toBe(false);

      await expect(
        operationRepository.existsActiveByAccountId(
          otherUser.id,
          otherAccount.id,
        ),
      ).resolves.toBe(true);
    });
  });

  describe('save', () => {
    it('should insert operations successfully if snapshot is empty', async () => {
      const fetchedTransactionRelationsBeforeSaving =
        await testDB.getTransactionWithRelations(transaction.getId().valueOf());

      const operationsCountBeforeSaving =
        fetchedTransactionRelationsBeforeSaving?.operations.length;

      expect(operationsCountBeforeSaving).toBe(0);

      const operations = data.operations.map((operation) =>
        OperationPersistenceMapper.toDBRow(operation),
      );

      await operationRepository.save(userSnapshot.id, operations, new Map());

      const fetchedTransactionRelationsAfterSaving =
        await testDB.getTransactionWithRelations(transaction.getId().valueOf());

      const operationsCountAfterSaving =
        fetchedTransactionRelationsAfterSaving?.operations.length;

      expect(operationsCountAfterSaving).toBe(data.operations.length);

      const ops = fetchedTransactionRelationsAfterSaving?.operations;

      ops?.forEach((op, index) => {
        const originalOp = operations[index];
        expect(op).toEqual(expect.objectContaining(originalOp));
      });
    });

    it('should reject operation insert with ForeignKeyConstraintError when account belongs to another user at DB level', async () => {
      const otherUser = await testDB.createUser({
        email: `other-${Date.now()}@example.com`,
      });

      const otherCommodity = await testDB.createCommodity(otherUser.id);

      const otherAccount = await testDB.createAccount(
        otherUser.id,
        otherCommodity.id,
      );

      const operation = OperationPersistenceMapper.toDBRow(data.operations[0]);

      const operationWithOtherAccount = {
        ...operation,
        accountId: otherAccount.id,
      };

      await expect(
        operationRepository.save(
          userSnapshot.id,
          [operationWithOtherAccount],
          new Map(),
        ),
      ).rejects.toThrow(ForeignKeyConstraintError);
    });

    it('should reject operation insert with ForeignKeyConstraintError when transaction belongs to another user at DB level', async () => {
      const otherUser = await testDB.createUser({
        email: `other-${Date.now()}@example.com`,
      });

      const otherCommodity = await testDB.createCommodity(otherUser.id);

      const otherTransaction = await testDB.createTransaction(
        otherUser.id,
        otherCommodity.id,
      );

      const operation = OperationPersistenceMapper.toDBRow(data.operations[0]);

      const operationWithOtherTransaction = {
        ...operation,
        transactionId: otherTransaction.id,
      };

      await expect(
        operationRepository.save(
          userSnapshot.id,
          [operationWithOtherTransaction],
          new Map(),
        ),
      ).rejects.toThrow(ForeignKeyConstraintError);
    });

    it('should update and delete operations successfully based on the snapshot', async () => {
      const operations = data.operations.map((operation) =>
        OperationPersistenceMapper.toDBRow(operation),
      );

      await Promise.all(
        operations.map((operation) => testDB.insertOperation(operation)),
      );

      const transactionWithRelations = await testDB.getTransactionWithRelations(
        transaction.getId().valueOf(),
      );

      const operationsSnapshot = new Map<UUID, OperationSnapshot>();

      transactionWithRelations?.operations.forEach((op) => {
        operationsSnapshot.set(op.id, op);
      });

      const createdOperations = transactionWithRelations?.operations ?? [];

      createdOperations.forEach((createdOp, index) => {
        const originalOp = operations[index];

        expect(createdOp).toEqual(expect.objectContaining(originalOp));
      });

      const operationsToUpdate = [operations[0], operations[1]];
      const operationsToDelete = [operations[2], operations[3]];

      const operationsToUpdatedIds = operationsToUpdate.map((op) => op.id);
      const operationsToDeleteIds = operationsToDelete.map((op) => op.id);

      const operationsToUpdateData = [
        {
          ...operationsToUpdate[0],
          amount: Amount.create('5000').valueOf(),
          description: 'Updated Operation One',
          updatedAt: Timestamp.restore('2026-01-01T00:00:00.000Z').valueOf(),
        },
        {
          ...operationsToUpdate[1],
          amount: Amount.create('-5000').valueOf(),
          description: 'Updated Operation Two',
          updatedAt: Timestamp.restore('2026-01-01T00:00:01.000Z').valueOf(),
        },
      ];

      const operationsToDeleteData = [
        {
          ...operationsToDelete[0],
          isTombstone: true,
          updatedAt: Timestamp.restore('2026-01-01T00:00:02.000Z').valueOf(),
        },
        {
          ...operationsToDelete[1],
          isTombstone: true,
          updatedAt: Timestamp.restore('2026-01-01T00:00:03.000Z').valueOf(),
        },
      ];

      await operationRepository.save(
        userSnapshot.id,
        [...operationsToUpdateData, ...operationsToDeleteData],
        operationsSnapshot,
      );

      const operationsAfterSaving = (
        await testDB.getTransactionWithRelations(transaction.getId().valueOf())
      )?.operations;

      expect(operationsAfterSaving).toBeDefined();

      const checkedOperations = new Set<UUID>();

      const getMappedOperation = (
        id: UUID,
      ): {
        operation: OperationDbRow | undefined;
        result: 'updated' | 'deleted' | 'untouched';
      } | null => {
        if (checkedOperations.has(id)) {
          return null;
        }

        checkedOperations.add(id);

        if (operationsToUpdatedIds.includes(id)) {
          return {
            operation: operationsToUpdateData.find((o) => o.id === id),
            result: 'updated',
          };
        }

        if (operationsToDeleteIds.includes(id)) {
          return {
            operation: operationsToDeleteData.find((o) => o.id === id),
            result: 'deleted',
          };
        }

        return {
          operation: operations.find((o) => o.id === id),
          result: 'untouched',
        };
      };

      const updateOps: OperationDbRow[] = [];
      const deleteOps: OperationDbRow[] = [];
      const untouchedOps: OperationDbRow[] = [];

      expect(operationsAfterSaving).toBeDefined();

      operationsAfterSaving?.forEach((op) => {
        const mappedOp = getMappedOperation(op.id);

        expect(mappedOp).toBeDefined();

        if (!mappedOp?.operation) {
          throw new Error('Unreachable code');
        }

        if (mappedOp?.result === 'untouched') {
          compareEntities<OperationDbRow>(op, mappedOp.operation);
          untouchedOps.push(op);
          return;
        }

        if (mappedOp?.result === 'updated') {
          compareEntities<OperationDbRow>(op, mappedOp.operation);
          expect(op.updatedAt).toBe(mappedOp.operation.updatedAt);
          expect(op.updatedAt).not.toBe(
            operationsSnapshot.get(op.id)?.updatedAt,
          );
          updateOps.push(op);
          return;
        }

        if (mappedOp?.result === 'deleted') {
          expect(op.isTombstone).toBe(true);
          expect(op.updatedAt).toBe(mappedOp.operation.updatedAt);
          expect(op.updatedAt).not.toBe(
            operationsSnapshot.get(op.id)?.updatedAt,
          );
          deleteOps.push(op);
        }
      });

      expect(updateOps).toHaveLength(operationsToUpdateData.length);
      expect(deleteOps).toHaveLength(operationsToDeleteData.length);
      expect(untouchedOps).toHaveLength(
        data.operations.length -
          operationsToUpdateData.length -
          operationsToDeleteData.length,
      );
    });

    it('should batch soft-delete updates while preserving per-operation updatedAt values', async () => {
      const operations = data.operations.map((operation) =>
        OperationPersistenceMapper.toDBRow(operation),
      );

      await Promise.all(
        operations.map((operation) => testDB.insertOperation(operation)),
      );

      const transactionWithRelations = await testDB.getTransactionWithRelations(
        transaction.getId().valueOf(),
      );

      const operationsSnapshot = new Map<UUID, OperationSnapshot>();

      transactionWithRelations?.operations.forEach((op) => {
        operationsSnapshot.set(op.id, op);
      });

      const operationsToDeleteData = operations.slice(0, 3).map(
        (operation, index): OperationDbRow => ({
          ...operation,
          isTombstone: true,
          updatedAt: Timestamp.restore(
            `2026-01-01T00:00:0${index}.000Z`,
          ).valueOf(),
        }),
      );

      const updateSpy = vi.spyOn(testDB.db, 'update');

      try {
        await operationRepository.save(
          userSnapshot.id,
          operationsToDeleteData,
          operationsSnapshot,
        );

        const operationUpdateCalls = updateSpy.mock.calls.filter(
          ([table]) => table === operationsTable,
        );

        expect(operationUpdateCalls).toHaveLength(1);
      } finally {
        updateSpy.mockRestore();
      }

      const operationsAfterSaving = (
        await testDB.getTransactionWithRelations(transaction.getId().valueOf())
      )?.operations;

      operationsToDeleteData.forEach((deletedOperation) => {
        const operationAfterSaving = operationsAfterSaving?.find(
          (operation) => operation.id === deletedOperation.id,
        );

        expect(operationAfterSaving?.isTombstone).toBe(true);
        expect(operationAfterSaving?.updatedAt).toBe(
          deletedOperation.updatedAt,
        );
      });
    });

    it.todo(
      'should insert, update and delete operations in a single save call',
    );

    it.todo(
      'should update an operation that exists in snapshot and has isTombstone: false with no field changes',
    );

    it('should reject saving an operation that is already tombstone in the snapshot', async () => {
      const operations = data.operations.map((operation) =>
        OperationPersistenceMapper.toDBRow(operation),
      );

      await Promise.all(
        operations.map((operation) => testDB.insertOperation(operation)),
      );

      const transactionWithRelationsBeforeDelete =
        await testDB.getTransactionWithRelations(transaction.getId().valueOf());

      const operationsSnapshot = new Map<UUID, OperationSnapshot>();

      transactionWithRelationsBeforeDelete?.operations.forEach((op) => {
        operationsSnapshot.set(op.id, op);
      });

      const operationToDelete = operations[0];

      await operationRepository.save(
        userSnapshot.id,
        [
          {
            ...operationToDelete,
            isTombstone: true,
          },
        ],
        operationsSnapshot,
      );

      const transactionWithRelationsAfterDelete =
        await testDB.getTransactionWithRelations(transaction.getId().valueOf());

      const tombstoneSnapshot = new Map<UUID, OperationSnapshot>();

      transactionWithRelationsAfterDelete?.operations.forEach((op) => {
        tombstoneSnapshot.set(op.id, op);
      });

      const deletedOperation = tombstoneSnapshot.get(operationToDelete.id);

      expect(deletedOperation?.isTombstone).toBe(true);

      await expect(
        operationRepository.save(
          userSnapshot.id,
          [
            {
              ...operationToDelete,
              isTombstone: true,
            },
          ],
          tombstoneSnapshot,
        ),
      ).rejects.toThrow(RepositoryInvariantError);

      const transactionWithRelationsAfterRejectedSave =
        await testDB.getTransactionWithRelations(transaction.getId().valueOf());

      const operationAfterRejectedSave =
        transactionWithRelationsAfterRejectedSave?.operations.find(
          (op) => op.id === operationToDelete.id,
        );

      expect(operationAfterRejectedSave).toEqual(deletedOperation);
    });

    it.todo(
      'should reject updating an operation that is already tombstone in the snapshot',
    );

    it.todo(
      'should insert an operation with isTombstone: true if it is not present in the snapshot',
    );

    it.todo('should not affect operations belonging to a different user');
  });
});
