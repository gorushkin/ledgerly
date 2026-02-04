import { UUID } from '@ledgerly/shared/types';
import { OperationMapper } from 'src/application';
import { OperationDbRow, UserDbRow } from 'src/db/schema';
import { compareEntities, TransactionBuilder } from 'src/db/test-utils';
import { Transaction, User } from 'src/domain';
import { Amount } from 'src/domain/domain-core';
import { OperationSnapshot } from 'src/domain/operations/types';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { TestDB } from '../../../db/test-db';
import { TransactionManager } from '../TransactionManager';

import { OperationRepository } from './operation.repository';

describe('OperationRepository', () => {
  let testDB: TestDB;
  let user: UserDbRow;

  let transaction: Transaction;

  const transactionManager = {
    getCurrentTransaction: () => testDB.db,
    run: vi.fn((cb: () => unknown) => {
      return cb();
    }),
  };
  let expectedOperationsCount: number;

  const operationRepository = new OperationRepository(
    transactionManager as unknown as TransactionManager,
  );

  beforeEach(async () => {
    testDB = new TestDB();
    await testDB.setupTestDb();
    user = await testDB.createUser();

    const transactionBuilder = TransactionBuilder.create(
      User.fromPersistence(user),
    );

    const entriesData = [
      {
        description: 'First Entry',
        operations: [
          { accountKey: 'USD', amount: '10000', description: '1' },
          { accountKey: 'EUR', amount: '-10000', description: '2' },
        ],
      },
      {
        description: 'Second Entry',
        operations: [
          { accountKey: 'USD', amount: '20000', description: '1' },
          { accountKey: 'USD', amount: '-20000', description: '2' },
        ],
      },
      {
        description: 'Third Entry',
        operations: [
          { accountKey: 'USD', amount: '20000', description: '1' },
          { accountKey: 'USD', amount: '-20000', description: '2' },
        ],
      },
    ];

    expectedOperationsCount = entriesData.reduce((ac, item) => {
      let isDifferent = false;

      let prevAccountKey: string | null = null;

      for (const op of item.operations) {
        if (prevAccountKey && op.accountKey !== prevAccountKey) {
          isDifferent = true;
          break;
        }
        prevAccountKey = op.accountKey;
      }

      return ac + (isDifferent ? 4 : 2);
    }, 0);

    const data = transactionBuilder
      .withAccounts(['USD', 'EUR'])
      .withEntries(entriesData)
      .withSystemAccounts()
      .build();

    transaction = data.transaction;

    await Promise.all(
      data.accounts.map((account) =>
        testDB.insertAccount(account.toPersistence()),
      ),
    );

    await testDB.insertTransaction(transaction.toSnapshot());

    const entries = transaction.getEntries();

    await Promise.all(
      entries.map((entry) => testDB.insertEntry(entry.toSnapshot())),
    );
  });

  describe('save', () => {
    it('should insert operations successfully if snapshot is empty', async () => {
      const fetchedTransactionRelationsBeforeSaving =
        await testDB.getTransactionWithRelations(transaction.getId().valueOf());

      const operationsCountBeforeSaving =
        fetchedTransactionRelationsBeforeSaving?.entries
          .map((e) => e.operations)
          .flat();

      expect(operationsCountBeforeSaving).toHaveLength(0);

      const operations = transaction
        .getEntries()
        .flatMap((entry) =>
          entry
            .getOperations()
            .map((operation) => OperationMapper.toDBRow(operation)),
        );

      await operationRepository.save(user.id, operations, new Map());

      const fetchedTransactionRelationsAfterSaving =
        await testDB.getTransactionWithRelations(transaction.getId().valueOf());

      const operationsCountAfterSaving =
        fetchedTransactionRelationsAfterSaving?.entries
          .map((e) => e.operations)
          .flat();

      expect(operationsCountAfterSaving).toHaveLength(expectedOperationsCount);

      const ops = fetchedTransactionRelationsAfterSaving?.entries
        .map((e) => e.operations)
        .flat();

      ops?.forEach((op, index) => {
        const originalOp = operations[index];

        expect(op).toEqual(expect.objectContaining(originalOp));
      });
    });

    it('should update and delete operations successfully based on the snapshot', async () => {
      const operations = transaction
        .getEntries()
        .flatMap((entry) =>
          entry
            .getOperations()
            .map((operation) => OperationMapper.toDBRow(operation)),
        );

      await Promise.all(
        operations.map((operation) => testDB.insertOperation(operation)),
      );

      const transactionWithRelations = await testDB.getTransactionWithRelations(
        transaction.getId().valueOf(),
      );

      const operationsSnapshot = new Map<UUID, OperationSnapshot>();

      transactionWithRelations?.entries.forEach((entry) => {
        entry.operations.forEach((operationSnapshot) => {
          operationsSnapshot.set(operationSnapshot.id, operationSnapshot);
        });
      });

      const createdOperations =
        transactionWithRelations?.entries.flatMap((e) => e.operations).flat() ??
        [];

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
        },
        {
          ...operationsToUpdate[1],
          amount: Amount.create('-5000').valueOf(),
          description: 'Updated Operation Two',
        },
      ];

      const operationsToDeleteData = [
        {
          ...operationsToDelete[0],
          isTombstone: true,
        },
        {
          ...operationsToDelete[1],
          isTombstone: true,
        },
      ];

      await operationRepository.save(
        user.id,
        [...operationsToUpdateData, ...operationsToDeleteData],
        operationsSnapshot,
      );

      const operationsAfterSaving = (
        await testDB.getTransactionWithRelations(transaction.getId().valueOf())
      )?.entries
        .map((e) => e.operations)
        .flat();

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
          compareEntities<OperationDbRow>(op, mappedOp.operation, [
            'updatedAt',
          ]);
          updateOps.push(op);
          return;
        }

        if (mappedOp?.result === 'deleted') {
          compareEntities<OperationDbRow>(op, mappedOp.operation, [
            'updatedAt',
          ]);
          deleteOps.push(op);
        }
      });

      expect(updateOps).toHaveLength(operationsToUpdateData.length);
      expect(deleteOps).toHaveLength(operationsToDeleteData.length);
      expect(untouchedOps).toHaveLength(
        expectedOperationsCount -
          operationsToUpdateData.length -
          operationsToDeleteData.length,
      );
    });
  });
});
