import {
  CurrencyCode,
  UUID,
} from 'node_modules/@ledgerly/shared/src/types/types';
import { CreateEntryRequestDTO } from 'src/application';
import { EntryContext } from 'src/application/services/EntriesService/entries.updater';
import { createUser } from 'src/db/createTestUser';
import {
  Account,
  AccountType,
  Operation,
  Transaction,
  User,
} from 'src/domain/';
import { Amount, Currency, DateValue, Id, Name } from 'src/domain/domain-core/';
import { beforeAll, describe, expect, it } from 'vitest';

import {
  EmptyOperationsError,
  DeletedEntityOperationError,
  OperationOwnershipError,
  UnbalancedEntryError,
} from '../domain.errors';

import { Entry } from './entry.entity';

// TODO: move async from describe to beforeEach
describe('Entry Domain Entity', async () => {
  let user: User;

  const anotherUser = await createUser();
  const transactionPostingDate = DateValue.restore('2024-01-01');
  const transactionDate = DateValue.restore('2024-01-01');

  let usdAccount: Account;

  let eurAccount: Account;
  let usdSystemAccount: Account;
  let eurSystemAccount: Account;

  let entryData: CreateEntryRequestDTO;
  let entryContext: EntryContext;
  let transaction: Transaction;

  beforeAll(async () => {
    user = await createUser();

    usdAccount = Account.create(
      user,
      Name.create('USD Account'),
      'USD',
      Amount.create('0'),
      Currency.create('USD'),
      AccountType.create('asset'),
    );

    eurAccount = Account.create(
      user,
      Name.create('EUR Account'),
      'EUR',
      Amount.create('0'),
      Currency.create('EUR'),
      AccountType.create('asset'),
    );

    usdSystemAccount = Account.create(
      user,
      Name.create('USD System Account'),
      'System account for USD exchanges',
      Amount.create('0'),
      Currency.create('USD'),
      AccountType.create('liability'),
    );

    eurSystemAccount = Account.create(
      user,
      Name.create('EUR System Account'),
      'System account for EUR exchanges',
      Amount.create('0'),
      Currency.create('EUR'),
      AccountType.create('liability'),
    );

    entryData = {
      description: 'Sample Entry',
      operations: [
        {
          accountId: usdAccount.getId().valueOf(),
          amount: Amount.create('-200').valueOf(),
          description: 'Credit operation',
        },
        {
          accountId: eurAccount.getId().valueOf(),
          amount: Amount.create('100').valueOf(),
          description: 'Debit operation',
        },
      ],
    };

    entryContext = {
      accountsMap: new Map<UUID, Account>([
        [usdAccount.getId().valueOf(), usdAccount],
        [eurAccount.getId().valueOf(), eurAccount],
      ]),
      systemAccountsMap: new Map<CurrencyCode, Account>([
        [usdSystemAccount.getCurrency().valueOf(), usdSystemAccount],
        [eurSystemAccount.getCurrency().valueOf(), eurSystemAccount],
      ]),
    };

    transaction = Transaction.create(
      user,
      {
        description: 'Test Transaction',
        entries: [],
        postingDate: transactionPostingDate.valueOf(),
        transactionDate: transactionDate.valueOf(),
      },
      entryContext,
    );
  });

  describe('createEntryWithOperations', () => {
    it('should create a valid entry with operations successfully', () => {
      const entry = Entry.create(
        user,
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
      user,
      transaction.getId(),
      entryData,
      entryContext,
    );

    const entry2 = Entry.create(
      user,
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
      user,
      transaction.getId(),
      entryData,
      entryContext,
    );

    expect(entry.getTransactionId().equals(transaction.getId())).toBe(true);
  });

  it('should correctly identify ownership by user', () => {
    const entry = Entry.create(
      user,
      transaction.getId(),
      entryData,
      entryContext,
    );

    expect(entry.belongsToUser(user.getId())).toBe(true);
    expect(entry.belongsToUser(anotherUser.getId())).toBe(false);
  });

  it('should correctly identify relationship to transaction', () => {
    const entry = Entry.create(
      user,
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
      user,
      transaction.getId(),
      entryData,
      entryContext,
    );

    expect(entry.isDeleted()).toBe(false);
  });

  it('should be marked as deleted after markAsDeleted call', () => {
    const entry = Entry.create(
      user,
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
      user,
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
      user,
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
      user,
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
      user,
      transaction.getId(),
      entryData,
      entryContext,
    );

    expect(() => entry.addOperations([])).toThrow(EmptyOperationsError);
    expect(() => entry.addOperations([])).toThrow(
      'Cannot add empty operations array',
    );
  });

  it('should throw DeletedEntityOperationError when adding operations to deleted entry', () => {
    const entry = Entry.create(
      user,
      transaction.getId(),
      entryData,
      entryContext,
    );
    entry.markAsDeleted();

    const operation = Operation.create(
      user,
      usdAccount,
      entry,
      Amount.create('100'),
      'Test',
    );

    expect(() => entry.addOperations([operation])).toThrow(
      DeletedEntityOperationError,
    );
    expect(() => entry.addOperations([operation])).toThrow(
      'Cannot add operations on deleted entry',
    );
  });

  it('should throw OperationOwnershipError when operation does not belong to entry', () => {
    const entry1 = Entry.create(
      user,
      transaction.getId(),
      entryData,
      entryContext,
    );
    const entry2 = Entry.create(
      user,
      transaction.getId(),
      entryData,
      entryContext,
    );

    const operationForEntry2 = Operation.create(
      user,
      usdAccount,
      entry2,
      Amount.create('100'),
      'Test',
    );

    expect(() => entry1.addOperations([operationForEntry2])).toThrow(
      OperationOwnershipError,
    );
    expect(() => entry1.addOperations([operationForEntry2])).toThrow(
      'Operation does not belong to this entry',
    );
  });

  it('should throw EmptyOperationsError when operations are missing', () => {
    expect(() =>
      Entry.create(
        user,
        transaction.getId(),
        {
          ...entryData,
          operations: [] as unknown as CreateEntryRequestDTO['operations'],
        },
        entryContext,
      ),
    ).toThrow(EmptyOperationsError);
  });

  it.skip('should throw DeletedEntityOperationError when validating deleted entry', () => {
    const entry = Entry.create(
      user,
      transaction.getId(),
      entryData,
      entryContext,
    );

    const operation1 = Operation.create(
      user,
      usdAccount,
      entry,
      Amount.create('100'),
      'Test 1',
    );
    const operation2 = Operation.create(
      user,
      eurAccount,
      entry,
      Amount.create('-100'),
      'Test 2',
    );

    entry.addOperations([operation1, operation2]);
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
      Entry.create(user, transaction.getId(), entryData, entryContext),
    ).toThrow(UnbalancedEntryError);
  });

  it('should return a copy of operations array (immutability)', () => {
    const entry = Entry.create(
      user,
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
      user,
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
