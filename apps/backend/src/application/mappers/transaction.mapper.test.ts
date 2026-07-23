import { createUser } from 'src/db/createTestUser';
import { TransactionBuilder } from 'src/db/test-utils';
import { Transaction } from 'src/domain';
import { beforeAll, describe, expect, it } from 'vitest';

import { TransactionMapper } from './transaction.mapper';

describe('TransactionMapper', () => {
  let fixture: ReturnType<typeof TransactionBuilder.transaction>;

  beforeAll(async () => {
    const user = await createUser();

    fixture = TransactionBuilder.transaction({
      currencies: ['USD'],
      operations: [
        {
          accountKey: 'USD',
          amount: '100',
          description: 'Active debit',
        },
        {
          accountKey: 'USD',
          amount: '-100',
          description: 'Tombstone credit',
        },
      ],
      settings: {
        description: 'Transaction with tombstone operation',
        postingDate: '2026-07-10',
        transactionDate: '2026-07-09',
      },
      user,
    });
  });

  it('maps a transaction response from the active snapshot only', () => {
    const transactionSnapshot = fixture.transaction.toSnapshot();

    const activeOperation = transactionSnapshot.operations.find(
      (operation) => operation.description === 'Active debit',
    );

    const tombstoneOperation = transactionSnapshot.operations.find(
      (operation) => operation.description === 'Tombstone credit',
    );

    if (!activeOperation || !tombstoneOperation) {
      throw new Error('Test setup failed: expected operations were not found');
    }

    const transaction = Transaction.restore({
      ...transactionSnapshot,
      operations: [
        activeOperation,
        {
          ...tombstoneOperation,
          isTombstone: true,
        },
      ],
    });

    const response = TransactionMapper.toResponseDTO(transaction);

    expect(response).toEqual({
      commodityId: transactionSnapshot.commodityId,
      createdAt: transactionSnapshot.createdAt,
      description: transactionSnapshot.description,
      id: transactionSnapshot.id,
      operations: [
        {
          accountId: activeOperation.accountId,
          amount: activeOperation.amount,
          createdAt: activeOperation.createdAt,
          description: activeOperation.description,
          id: activeOperation.id,
          isSystem: activeOperation.isSystem,
          transactionId: activeOperation.transactionId,
          updatedAt: activeOperation.updatedAt,
          userId: activeOperation.userId,
          value: activeOperation.value,
        },
      ],
      postingDate: transactionSnapshot.postingDate,
      transactionDate: transactionSnapshot.transactionDate,
      updatedAt: transactionSnapshot.updatedAt,
      userId: transactionSnapshot.userId,
      version: transactionSnapshot.version,
    });

    expect(response.operations).toHaveLength(1);
    expect(response.operations[0]).not.toHaveProperty('isTombstone');
    expect(response.operations).not.toContainEqual(
      expect.objectContaining({
        id: tombstoneOperation.id,
      }),
    );
    expect(typeof response.operations[0]?.amount).toBe('string');
    expect(typeof response.operations[0]?.value).toBe('string');
    expect(typeof response.operations[0]?.createdAt).toBe('string');
    expect(typeof response.operations[0]?.updatedAt).toBe('string');
  });
});
