import { createUser } from 'src/db/createTestUser';
import { describe, expect, it } from 'vitest';

import { DateValue } from '../domain-core';
import { Transaction } from '../transactions';

import { Entry } from './entry.entity';

describe('Entry Domain Entity', async () => {
  const user = await createUser();
  const anotherUser = await createUser();
  const transactionPostingDate = DateValue.restore('2024-01-01');
  const transactionDate = DateValue.restore('2024-01-01');

  const transaction = Transaction.create(
    user.getId(),
    'Test transaction',
    transactionPostingDate,
    transactionDate,
  );

  it('should create a valid entry successfully', () => {
    const entry = Entry.create(user, transaction);

    expect(entry).toBeInstanceOf(Entry);
    expect(entry.belongsToTransaction(transaction.getId())).toBe(true);
    expect(entry.belongsToUser(user.getId())).toBe(true);
    expect(entry.isDeleted()).toBe(false);
  });

  it('should have a unique ID when created', () => {
    const entry1 = Entry.create(user, transaction);
    const entry2 = Entry.create(user, transaction);

    expect(entry1.getId()).toBeDefined();
    expect(entry2.getId()).toBeDefined();
    expect(entry1.getId().isEqualTo(entry2.getId())).toBe(false);
  });

  it('should return correct transaction ID', () => {
    const entry = Entry.create(user, transaction);

    expect(entry.getTransactionId().isEqualTo(transaction.getId())).toBe(true);
  });

  it('should correctly identify ownership by user', () => {
    const entry = Entry.create(user, transaction);

    expect(entry.belongsToUser(user.getId())).toBe(true);
    expect(entry.belongsToUser(anotherUser.getId())).toBe(false);
  });

  it('should correctly identify relationship to transaction', () => {
    const entry = Entry.create(user, transaction);

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
    const entry = Entry.create(user, transaction);

    expect(entry.isDeleted()).toBe(false);
  });

  it('should be marked as deleted after markAsDeleted call', () => {
    const entry = Entry.create(user, transaction);

    expect(entry.isDeleted()).toBe(false);

    entry.markAsDeleted();

    expect(entry.isDeleted()).toBe(true);
  });

  it('should remain deleted after multiple markAsDeleted calls', () => {
    const entry = Entry.create(user, transaction);

    entry.markAsDeleted();
    entry.markAsDeleted();

    expect(entry.isDeleted()).toBe(true);
  });

  it('should maintain transaction relationship after being marked as deleted', () => {
    const entry = Entry.create(user, transaction);

    entry.markAsDeleted();

    expect(entry.belongsToTransaction(transaction.getId())).toBe(true);
    expect(entry.getTransactionId().isEqualTo(transaction.getId())).toBe(true);
  });

  it('should maintain user ownership after being marked as deleted', () => {
    const entry = Entry.create(user, transaction);

    entry.markAsDeleted();

    expect(entry.belongsToUser(user.getId())).toBe(true);
  });
});
