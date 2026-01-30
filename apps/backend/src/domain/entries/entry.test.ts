import { CreateEntryRequestDTO } from 'src/application';
import { EntryContext } from 'src/application/services/EntriesService/entries.updater';
import { createUser } from 'src/db/createTestUser';
import { TransactionBuilder } from 'src/db/test-utils';
import {
  Account,
  DeletedEntityOperationError,
  EmptyOperationsError,
  Operation,
  OperationOwnershipError,
  Transaction,
  UnbalancedEntryError,
  User,
} from 'src/domain/';
import { beforeAll, describe, expect, it } from 'vitest';

import { Amount, Id } from '../domain-core';

import { Entry } from './entry.entity';

describe('Entry Domain Entity', () => {
  let user: User;
  let userId: Id;
  let anotherUser: User;

  let entryData: CreateEntryRequestDTO;

  let createEntryRequests: CreateEntryRequestDTO[];
  let entryContext: EntryContext;
  let transaction: Transaction;

  let usdAccount: Account;
  let eurAccount: Account;

  const transactionData = {
    description: 'Test transaction',
    postingDate: '2024-01-01',
    transactionDate: '2024-01-01',
    userId: '123e4567-e89b-12d3-a456-426614174000',
  };

  const entriesData = [
    {
      description: 'First Entry',
      operations: [
        { accountKey: 'USD', amount: '10000', description: '1' },
        { accountKey: 'USD', amount: '-10000', description: '2' },
      ],
    },
  ];

  beforeAll(async () => {
    user = await createUser();
    userId = user.getId();

    anotherUser = await createUser();

    const transactionBuilder = TransactionBuilder.create(user);

    const data = transactionBuilder
      .withSettings(transactionData)
      .withAccounts(['USD', 'EUR'])
      .withSystemAccounts()
      .withEntries(entriesData)
      .build();

    entryContext = data.entryContext;
    transaction = data.transaction;
    createEntryRequests = data.entryData;
    entryData = createEntryRequests[0];

    usdAccount = data.getAccountByKey('USD');
    eurAccount = data.getAccountByKey('EUR');
  });

  describe('createEntryWithOperations', () => {
    it('should create a valid entry with operations successfully', () => {
      const entry = Entry.create(
        userId,
        transaction.getId(),
        entryData,
        entryContext,
      );

      expect(entry).toBeInstanceOf(Entry);
      expect(entry.belongsToTransaction(transaction.getId())).toBe(true);
      expect(entry.belongsToUser(user.getId())).toBe(true);
      expect(entry.isDeleted()).toBe(false);
    });
  });

  it('should have a unique ID when created', () => {
    const entry1 = Entry.create(
      userId,
      transaction.getId(),
      entryData,
      entryContext,
    );

    const entry2 = Entry.create(
      userId,
      transaction.getId(),
      entryData,
      entryContext,
    );

    expect(entry1.getId()).toBeDefined();
    expect(entry2.getId()).toBeDefined();
    expect(entry1.getId().equals(entry2.getId())).toBe(false);
  });

  it('should return correct transaction ID', () => {
    const entry = Entry.create(
      userId,
      transaction.getId(),
      entryData,
      entryContext,
    );

    expect(entry.getTransactionId().equals(transaction.getId())).toBe(true);
  });

  it('should correctly identify ownership by user', () => {
    const entry = Entry.create(
      userId,
      transaction.getId(),
      entryData,
      entryContext,
    );

    expect(entry.belongsToUser(user.getId())).toBe(true);
    expect(entry.belongsToUser(anotherUser.getId())).toBe(false);
  });

  it('should correctly identify relationship to transaction', () => {
    const entry = Entry.create(
      userId,
      transaction.getId(),
      entryData,
      entryContext,
    );

    const anotherTransactionId = Id.create();

    expect(entry.belongsToTransaction(transaction.getId())).toBe(true);
    expect(entry.belongsToTransaction(anotherTransactionId)).toBe(false);
  });

  it('should not be deleted when created', () => {
    const entry = Entry.create(
      userId,
      transaction.getId(),
      entryData,
      entryContext,
    );

    expect(entry.isDeleted()).toBe(false);
  });

  it('should be marked as deleted after markAsDeleted call', () => {
    const entry = Entry.create(
      userId,
      transaction.getId(),
      entryData,
      entryContext,
    );

    expect(entry.isDeleted()).toBe(false);

    entry.markAsDeleted();

    expect(entry.isDeleted()).toBe(true);
  });

  it('should remain deleted after multiple markAsDeleted calls', () => {
    const entry = Entry.create(
      userId,
      transaction.getId(),
      entryData,
      entryContext,
    );

    entry.markAsDeleted();
    entry.markAsDeleted();

    expect(entry.isDeleted()).toBe(true);
  });

  it('should maintain transaction relationship after being marked as deleted', () => {
    const entry = Entry.create(
      userId,
      transaction.getId(),
      entryData,
      entryContext,
    );

    entry.markAsDeleted();

    expect(entry.belongsToTransaction(transaction.getId())).toBe(true);
    expect(entry.getTransactionId().equals(transaction.getId())).toBe(true);
  });

  it('should maintain user ownership after being marked as deleted', () => {
    const entry = Entry.create(
      userId,
      transaction.getId(),
      entryData,
      entryContext,
    );

    entry.markAsDeleted();

    expect(entry.belongsToUser(user.getId())).toBe(true);
  });

  // TODO: fix and enable these tests
  // it('should add operations properly', () => {
  //   const entry = Entry.create(
  //     user,
  //     transaction.getId(),
  //     entryData,
  //     entryContext,
  //   );

  //   const fromUsdOperation = Operation.create(
  //     user,
  //     usdAccount,
  //     entry,
  //     Amount.create('100'),
  //     'From USD',
  //   );

  //   const toEurOperation = Operation.create(
  //     user,
  //     eurAccount,
  //     entry,
  //     Amount.create('100'),
  //     'To EUR',
  //   );

  //   const operations = [fromUsdOperation, toEurOperation];

  //   entry.addOperations(operations);

  //   expect(entry.getOperations().length).toBe(operations.length);

  //   const entryOperations = entry.getOperations();

  //   expect(entryOperations).toContain(fromUsdOperation);
  //   expect(entryOperations).toContain(toEurOperation);
  // });

  it('should throw EmptyOperationsError when adding empty operations array', () => {
    const entry = Entry.create(
      userId,
      transaction.getId(),
      entryData,
      entryContext,
    );

    expect(() => entry.attachOperations([])).toThrow(EmptyOperationsError);
    expect(() => entry.attachOperations([])).toThrow(
      'Cannot add empty operations array',
    );
  });

  it('should throw DeletedEntityOperationError when adding operations to deleted entry', () => {
    const entry = Entry.create(
      userId,
      transaction.getId(),
      entryData,
      entryContext,
    );
    entry.markAsDeleted();

    const operation = Operation.create(
      userId,
      usdAccount,
      entry,
      Amount.create('100'),
      'Test',
    );

    expect(() => entry.attachOperations([operation])).toThrow(
      DeletedEntityOperationError,
    );
    expect(() => entry.attachOperations([operation])).toThrow(
      'Cannot add operations on deleted entry',
    );
  });

  it('should throw OperationOwnershipError when operation does not belong to entry', () => {
    const entry1 = Entry.create(
      userId,
      transaction.getId(),
      entryData,
      entryContext,
    );
    const entry2 = Entry.create(
      userId,
      transaction.getId(),
      entryData,
      entryContext,
    );

    const operationForEntry2 = Operation.create(
      userId,
      usdAccount,
      entry2,
      Amount.create('100'),
      'Test',
    );

    expect(() => entry1.attachOperations([operationForEntry2])).toThrow(
      OperationOwnershipError,
    );
    expect(() => entry1.attachOperations([operationForEntry2])).toThrow(
      'Operation does not belong to this entry',
    );
  });

  it('should throw EmptyOperationsError when operations are missing', () => {
    expect(() =>
      Entry.create(
        userId,
        transaction.getId(),
        {
          ...entryData,
          operations: [] as unknown as CreateEntryRequestDTO['operations'],
        },
        entryContext,
      ),
    ).toThrow(EmptyOperationsError);
  });

  it('should throw DeletedEntityOperationError when validating deleted entry', () => {
    const entry = Entry.create(
      userId,
      transaction.getId(),
      entryData,
      entryContext,
    );

    const operation1 = Operation.create(
      userId,
      usdAccount,
      entry,
      Amount.create('100'),
      'Test 1',
    );
    const operation2 = Operation.create(
      userId,
      eurAccount,
      entry,
      Amount.create('-100'),
      'Test 2',
    );

    entry.attachOperations([operation1, operation2]);
    entry.markAsDeleted();

    expect(() => entry.validateBalance()).toThrow(DeletedEntityOperationError);
    expect(() => entry.validateBalance()).toThrow(
      'Cannot validate on deleted entry',
    );
  });

  it('should throw UnbalancedEntryError when operations do not balance', () => {
    const entryData: CreateEntryRequestDTO = {
      description: 'Sample Entry',
      operations: [
        {
          accountId: usdAccount.getId().valueOf(),
          amount: Amount.create('-200').valueOf(),
          description: 'Credit operation',
        },
        {
          accountId: usdAccount.getId().valueOf(),
          amount: Amount.create('100').valueOf(),
          description: 'Debit operation',
        },
      ],
    };

    expect(() =>
      Entry.create(userId, transaction.getId(), entryData, entryContext),
    ).toThrow(UnbalancedEntryError);
  });

  it('should return a copy of operations array (immutability)', () => {
    const entry = Entry.create(
      userId,
      transaction.getId(),
      entryData,
      entryContext,
    );

    const operations1 = entry.getOperations();
    const operations2 = entry.getOperations();

    expect(operations1).not.toBe(operations2); // Different references
    expect(operations1).toEqual(operations2); // Same content
  });

  it('should restore from persistence with operations correctly', () => {
    const entryData: CreateEntryRequestDTO = {
      description: 'Sample Entry',
      operations: [
        {
          accountId: usdAccount.getId().valueOf(),
          amount: Amount.create('-200').valueOf(),
          description: 'Credit operation',
        },
        {
          accountId: usdAccount.getId().valueOf(),
          amount: Amount.create('200').valueOf(),
          description: 'Debit operation',
        },
      ],
    };

    const entry = Entry.create(
      userId,
      transaction.getId(),
      entryData,
      entryContext,
    );

    const persistenceData = entry.toPersistence();

    const restoredEntry = Entry.restore({
      ...persistenceData,
      operations: entry.getOperations().map((op) => op.toPersistence()),
    });

    expect(restoredEntry.toPersistence()).toEqual(entry.toPersistence());

    expect(restoredEntry.getOperations().length).toBe(
      entryData.operations.length,
    );
  });
});
