import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { Id } from '../domain-core';
import { DateValue } from '../domain-core/value-objects/DateValue';

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

  it('should update description and touch updatedAt', () => {
    const transaction = Transaction.create(
      userId,
      transactionData.description,
      postingDate,
      transactionDate,
    );

    const originalUpdatedAt = transaction.getUpdatedAt();

    vi.advanceTimersByTime(5);

    transaction.updateDescription('Updated description');

    expect(transaction.description).toBe('Updated description');

    expect(transaction.getUpdatedAt().toDate().getTime()).toBeGreaterThan(
      originalUpdatedAt.toDate().getTime(),
    );

    expect(originalUpdatedAt).not.toEqual(transaction.getUpdatedAt());
  });

  it('should update postingDate and touch updatedAt', () => {
    const transaction = Transaction.create(
      userId,
      transactionData.description,
      postingDate,
      transactionDate,
    );

    const originalUpdatedAt = transaction.getUpdatedAt();

    vi.advanceTimersByTime(5);

    transaction.updatePostingDate(DateValue.create());

    expect(transaction.getPostingDate()).not.toEqual(postingDate);
    expect(originalUpdatedAt).not.toEqual(transaction.getUpdatedAt());
    expect(transaction.getUpdatedAt().toDate().getTime()).toBeGreaterThan(
      originalUpdatedAt.toDate().getTime(),
    );
  });

  it('should update transactionDate and touch updatedAt', () => {
    const transaction = Transaction.create(
      userId,
      transactionData.description,
      postingDate,
      transactionDate,
    );

    const originalUpdatedAt = transaction.getUpdatedAt();

    vi.advanceTimersByTime(5);

    transaction.updateTransactionDate(DateValue.create());

    expect(transaction.getTransactionDate()).not.toEqual(transactionDate);
    expect(originalUpdatedAt).not.toEqual(transaction.getUpdatedAt());
    expect(transaction.getUpdatedAt().toDate().getTime()).toBeGreaterThan(
      originalUpdatedAt.toDate().getTime(),
    );
  });
});
