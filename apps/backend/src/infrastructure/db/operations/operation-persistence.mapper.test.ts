import { createUser } from 'src/db/createTestUser';
import { TransactionBuilder } from 'src/db/test-utils';
import { User } from 'src/domain';
import { beforeAll, describe, expect, it } from 'vitest';

import { OperationPersistenceMapper } from './operation-persistence.mapper';

describe('OperationPersistenceMapper', () => {
  let user: User;

  beforeAll(async () => {
    user = await createUser();
  });

  it('maps an operation snapshot to a persistence row', () => {
    const { operations } = TransactionBuilder.transaction({
      currencies: ['USD'],
      operations: [
        { accountKey: 'USD', amount: '100', description: 'Debit' },
        { accountKey: 'USD', amount: '-100', description: 'Credit' },
      ],
      user,
    });
    const snapshot = operations[0].toSnapshot();

    expect(OperationPersistenceMapper.toDBRowFromSnapshot(snapshot)).toEqual({
      accountId: snapshot.accountId,
      amount: snapshot.amount,
      createdAt: snapshot.createdAt,
      description: snapshot.description,
      id: snapshot.id,
      isSystem: snapshot.isSystem,
      isTombstone: snapshot.isTombstone,
      transactionId: snapshot.transactionId,
      updatedAt: snapshot.updatedAt,
      userId: snapshot.userId,
      value: snapshot.value,
    });
  });
});
