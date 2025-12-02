import { IsoDateString } from '@ledgerly/shared/types';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { Id } from '../domain-core';
import { DateValue } from '../domain-core/value-objects/DateValue';
import { Entry } from '../entries';

import { Transaction } from './transaction.entity';

describe('Transaction Domain Entity', () => {
  const transactionData = {
    description: 'Test transaction',
    postingDate: '2024-01-01',
    transactionDate: '2024-01-01',
    userId: '123e4567-e89b-12d3-a456-426614174000',
  };

  const userId = Id.fromPersistence(transactionData.userId);
  const postingDate = DateValue.restore(transactionData.postingDate);
  const transactionDate = DateValue.restore(transactionData.transactionDate);

  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should create a valid transaction', () => {
    const transaction = Transaction.create(
      userId,
      transactionData.description,
      postingDate,
      transactionDate,
    );

    expect(transaction).toBeInstanceOf(Transaction);
    expect(transaction.description).toBe(transactionData.description);
    expect(transaction.getPostingDate()).toEqual(postingDate);
    expect(transaction.getTransactionDate()).toEqual(transactionDate);
    expect(transaction.getId()).toBeDefined();
    expect(transaction.getCreatedAt()).toBeDefined();
    expect(transaction.getUpdatedAt()).toBeDefined();
    expect(transaction.isDeleted()).toBe(false);
  });

  it('should serialize and deserialize correctly', () => {
    const transaction = Transaction.create(
      userId,
      transactionData.description,
      postingDate,
      transactionDate,
    );

    const transactionRecord = transaction.toPersistence();

    expect(transactionRecord).toMatchObject({
      description: transactionData.description,
      postingDate: transactionData.postingDate,
      transactionDate: transactionData.transactionDate,
      userId: transactionData.userId,
    });

    const restoredTransaction = Transaction.restore(transactionRecord);

    expect(restoredTransaction.toPersistence()).toEqual(
      transaction.toPersistence(),
    );
  });

  it('should update description via update method and touch updatedAt', () => {
    const transaction = Transaction.create(
      userId,
      transactionData.description,
      postingDate,
      transactionDate,
    );

    const originalUpdatedAt = transaction.getUpdatedAt();

    vi.advanceTimersByTime(5);

    transaction.update({ description: 'Updated description' });

    expect(transaction.description).toBe('Updated description');

    expect(transaction.getUpdatedAt().toDate().getTime()).toBeGreaterThan(
      originalUpdatedAt.toDate().getTime(),
    );

    expect(originalUpdatedAt).not.toEqual(transaction.getUpdatedAt());
  });

  it('should update postingDate via update method and touch updatedAt', () => {
    const transaction = Transaction.create(
      userId,
      transactionData.description,
      postingDate,
      transactionDate,
    );

    const originalUpdatedAt = transaction.getUpdatedAt();
    const newPostingDate = '2024-01-15' as IsoDateString;

    vi.advanceTimersByTime(5);

    transaction.update({ postingDate: newPostingDate });

    expect(transaction.getPostingDate().valueOf()).toBe(newPostingDate);
    expect(originalUpdatedAt).not.toEqual(transaction.getUpdatedAt());
    expect(transaction.getUpdatedAt().toDate().getTime()).toBeGreaterThan(
      originalUpdatedAt.toDate().getTime(),
    );
  });

  it('should update transactionDate via update method and touch updatedAt', () => {
    const transaction = Transaction.create(
      userId,
      transactionData.description,
      postingDate,
      transactionDate,
    );

    const originalUpdatedAt = transaction.getUpdatedAt();
    const newTransactionDate = '2024-01-20' as IsoDateString;

    vi.advanceTimersByTime(5);

    transaction.update({ transactionDate: newTransactionDate });

    expect(transaction.getTransactionDate().valueOf()).toBe(newTransactionDate);
    expect(originalUpdatedAt).not.toEqual(transaction.getUpdatedAt());
    expect(transaction.getUpdatedAt().toDate().getTime()).toBeGreaterThan(
      originalUpdatedAt.toDate().getTime(),
    );
  });

  it('should update multiple fields at once via update method', () => {
    const transaction = Transaction.create(
      userId,
      transactionData.description,
      postingDate,
      transactionDate,
    );

    const newDescription = 'New description';
    const newPostingDate = '2024-02-01' as IsoDateString;
    const newTransactionDate = '2024-02-05' as IsoDateString;

    transaction.update({
      description: newDescription,
      postingDate: newPostingDate,
      transactionDate: newTransactionDate,
    });

    expect(transaction.description).toBe(newDescription);
    expect(transaction.getPostingDate().valueOf()).toBe(newPostingDate);
    expect(transaction.getTransactionDate().valueOf()).toBe(newTransactionDate);
  });

  describe('Entry Management', () => {
    let transaction: Transaction;

    beforeEach(() => {
      transaction = Transaction.create(
        userId,
        transactionData.description,
        postingDate,
        transactionDate,
      );
    });

    it('should start with empty entries array', () => {
      expect(transaction.getEntries()).toEqual([]);
    });

    it('should add entry successfully', () => {
      const transaction = Transaction.create(
        userId,
        transactionData.description,
        postingDate,
        transactionDate,
      );

      const mockEntry1 = {
        belongsToTransaction: () => true,
        data: 'mock entry data1',
      } as unknown as Entry;

      const mockEntry2 = {
        belongsToTransaction: () => true,
        data: 'mock entry data2',
      } as unknown as Entry;

      vi.spyOn(Entry, 'create').mockReturnValue(mockEntry1);

      transaction.addEntry(mockEntry1);
      transaction.addEntry(mockEntry2);

      const entries = transaction.getEntries();
      expect(entries).toHaveLength(2);
      expect(entries[0]).toBe(mockEntry1);
      expect(entries[1]).toBe(mockEntry2);
    });

    it.todo('should remove entry successfully', () => {
      // TODO: Implement when Entry.create is available
      // const entry = Entry.create(/* appropriate parameters */);
      // transaction.addEntry(entry);
      // transaction.removeEntry(entry.getId());
      // expect(transaction.getEntries()).toHaveLength(0);
    });

    it.todo('should throw error when removing non-existent entry', () => {
      // const nonExistentId = Id.create();
      // expect(() => transaction.removeEntry(nonExistentId)).toThrow('Entry not found in transaction');
    });

    it.todo('should validate entry belongs to transaction when adding', () => {
      // TODO: Test that entry validation works correctly
    });

    it('should provide read-only access to entries', () => {
      const entries = transaction.getEntries();
      expect(entries).toBeInstanceOf(Array);

      // Should return a readonly array
      expect(transaction.getEntries()).toHaveLength(0);
    });

    it.todo('should implement balance validation', () => {
      // TODO: Implement isBalanced and validateBalance tests
    });
  });
});
