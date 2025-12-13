import { createUser } from 'src/db/createTestUser';
import { Account, AccountType, Operation, Transaction } from 'src/domain/';
import { Amount, Currency, DateValue, Name } from 'src/domain/domain-core/';
import { describe, expect, it } from 'vitest';

import {
  EmptyOperationsError,
  DeletedEntityOperationError,
  OperationOwnershipError,
  MissingOperationsError,
  UnbalancedEntryError,
} from '../domain.errors';

import { Entry } from './entry.entity';

describe('Entry Domain Entity', async () => {
  const user = await createUser();
  const anotherUser = await createUser();
  const transactionPostingDate = DateValue.restore('2024-01-01');
  const transactionDate = DateValue.restore('2024-01-01');

  const usdAccount = Account.create(
    user,
    Name.create('USD Account'),
    'USD',
    Amount.create('0'),
    Currency.create('USD'),
    AccountType.create('asset'),
  );

  const eurAccount = Account.create(
    user,
    Name.create('EUR Account'),
    'EUR',
    Amount.create('0'),
    Currency.create('EUR'),
    AccountType.create('asset'),
  );

  const transaction = Transaction.create(
    user.getId(),
    'Test transaction',
    transactionPostingDate,
    transactionDate,
  );

  it('should create a valid entry successfully', () => {
    const entry = Entry.create(user, transaction, 'Test Entry');

    expect(entry).toBeInstanceOf(Entry);
    expect(entry.belongsToTransaction(transaction.getId())).toBe(true);
    expect(entry.belongsToUser(user.getId())).toBe(true);
    expect(entry.isDeleted()).toBe(false);
  });

  it('should have a unique ID when created', () => {
    const entry1 = Entry.create(user, transaction, 'Test Entry');
    const entry2 = Entry.create(user, transaction, 'Test Entry');

    expect(entry1.getId()).toBeDefined();
    expect(entry2.getId()).toBeDefined();
    expect(entry1.getId().equals(entry2.getId())).toBe(false);
  });

  it('should return correct transaction ID', () => {
    const entry = Entry.create(user, transaction, 'Test Entry');

    expect(entry.getTransactionId().equals(transaction.getId())).toBe(true);
  });

  it('should correctly identify ownership by user', () => {
    const entry = Entry.create(user, transaction, 'Test Entry');

    expect(entry.belongsToUser(user.getId())).toBe(true);
    expect(entry.belongsToUser(anotherUser.getId())).toBe(false);
  });

  it('should correctly identify relationship to transaction', () => {
    const entry = Entry.create(user, transaction, 'Test Entry');

    const anotherTransaction = Transaction.create(
      user.getId(),
      'Another transaction',
      transactionPostingDate,
      transactionDate,
    );

    expect(entry.belongsToTransaction(transaction.getId())).toBe(true);
    expect(entry.belongsToTransaction(anotherTransaction.getId())).toBe(false);
  });

  it('should not be deleted when created', () => {
    const entry = Entry.create(user, transaction, 'Test Entry');

    expect(entry.isDeleted()).toBe(false);
  });

  it('should be marked as deleted after markAsDeleted call', () => {
    const entry = Entry.create(user, transaction, 'Test Entry');

    expect(entry.isDeleted()).toBe(false);

    entry.markAsDeleted();

    expect(entry.isDeleted()).toBe(true);
  });

  it('should remain deleted after multiple markAsDeleted calls', () => {
    const entry = Entry.create(user, transaction, 'Test Entry');

    entry.markAsDeleted();
    entry.markAsDeleted();

    expect(entry.isDeleted()).toBe(true);
  });

  it('should maintain transaction relationship after being marked as deleted', () => {
    const entry = Entry.create(user, transaction, 'Test Entry');

    entry.markAsDeleted();

    expect(entry.belongsToTransaction(transaction.getId())).toBe(true);
    expect(entry.getTransactionId().equals(transaction.getId())).toBe(true);
  });

  it('should maintain user ownership after being marked as deleted', () => {
    const entry = Entry.create(user, transaction, 'Test Entry');

    entry.markAsDeleted();

    expect(entry.belongsToUser(user.getId())).toBe(true);
  });

  it('should add operations properly', () => {
    const entry = Entry.create(user, transaction, 'Test Entry');

    const fromUsdOperation = Operation.create(
      user,
      usdAccount,
      entry,
      Amount.create('100'),
      'From USD',
    );

    const toEurOperation = Operation.create(
      user,
      eurAccount,
      entry,
      Amount.create('100'),
      'To EUR',
    );

    const operations = [fromUsdOperation, toEurOperation];

    entry.addOperations(operations);

    expect(entry.getOperations().length).toBe(operations.length);

    const entryOperations = entry.getOperations();

    expect(entryOperations).toContain(fromUsdOperation);
    expect(entryOperations).toContain(toEurOperation);
  });

  it('should throw EmptyOperationsError when adding empty operations array', () => {
    const entry = Entry.create(user, transaction, 'Test Entry');

    expect(() => entry.addOperations([])).toThrow(EmptyOperationsError);
    expect(() => entry.addOperations([])).toThrow(
      'Cannot add empty operations array',
    );
  });

  it('should throw DeletedEntityOperationError when adding operations to deleted entry', () => {
    const entry = Entry.create(user, transaction, 'Test Entry');
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
    const entry1 = Entry.create(user, transaction, 'Test Entry');
    const entry2 = Entry.create(user, transaction, 'Test Entry');

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

  it('should throw MissingOperationsError when validating entry without operations', () => {
    const entry = Entry.create(user, transaction, 'Test Entry');

    expect(() => entry.validateBalance()).toThrow(MissingOperationsError);
    expect(() => entry.validateBalance()).toThrow(
      'Cannot validate entry without operations',
    );
  });

  it('should throw DeletedEntityOperationError when validating deleted entry', () => {
    const entry = Entry.create(user, transaction, 'Test Entry');

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
    const entry = Entry.create(user, transaction, 'Test Entry');

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
      Amount.create('-50'),
      'Test 2',
    );

    entry.addOperations([operation1, operation2]);

    expect(() => entry.validateBalance()).toThrow(UnbalancedEntryError);
  });

  it('should return a copy of operations array (immutability)', () => {
    const entry = Entry.create(user, transaction, 'Test Entry');

    const operation = Operation.create(
      user,
      usdAccount,
      entry,
      Amount.create('100'),
      'Test',
    );

    entry.addOperations([operation]);

    const operations1 = entry.getOperations();
    const operations2 = entry.getOperations();

    expect(operations1).not.toBe(operations2); // Different references
    expect(operations1).toEqual(operations2); // Same content
  });
});
