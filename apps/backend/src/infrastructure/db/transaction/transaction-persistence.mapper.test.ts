import { createUser } from 'src/db/createTestUser';
import { TransactionBuilder } from 'src/db/test-utils';
import { describe, expect, it } from 'vitest';

import { TransactionPersistenceMapper } from './transaction-persistence.mapper';

describe('TransactionPersistenceMapper', () => {
  it('maps a transaction aggregate to a persistence row', async () => {
    const user = await createUser();

    const { transaction } = TransactionBuilder.transaction({
      currencies: ['USD'],
      operations: [
        { accountKey: 'USD', amount: '100', description: 'Debit' },
        { accountKey: 'USD', amount: '-100', description: 'Credit' },
      ],
      user,
    });
    const snapshot = transaction.toSnapshot();

    expect(TransactionPersistenceMapper.toDBRow(transaction)).toEqual({
      commodityId: snapshot.commodityId,
      createdAt: snapshot.createdAt,
      description: snapshot.description,
      id: snapshot.id,
      isTombstone: snapshot.isTombstone,
      postingDate: snapshot.postingDate,
      transactionDate: snapshot.transactionDate,
      updatedAt: snapshot.updatedAt,
      userId: snapshot.userId,
      version: snapshot.version,
    });
  });
});
