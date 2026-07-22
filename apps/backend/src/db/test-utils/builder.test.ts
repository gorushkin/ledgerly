import { createCommodity, createUser } from 'src/db/createTestUser';
import { Commodity, User } from 'src/domain';
import { InsufficientOperationsError } from 'src/domain/domain.errors';
import { beforeAll, describe, expect, it } from 'vitest';

import { TransactionBuilder } from './testEntityBuilder';

describe('TransactionBuilder', () => {
  let user: User;
  let commodity: Commodity;

  beforeAll(async () => {
    user = await createUser();
    commodity = createCommodity(user);
  });

  it('should be implemented', () => {
    TransactionBuilder.transaction({
      accounts: ['USD', 'EUR'],
      commodity: commodity,
      operations: [
        { accountKey: 'USD', amount: '10000', description: '1' },
        {
          accountKey: 'USD',
          amount: '-10000',
          description: '2',
        },
      ],
      user,
    });
  });

  it('builds an invalid request fixture without creating a domain transaction', () => {
    const fixture = TransactionBuilder.request({
      accounts: ['USD'],
      commodity,
      operations: [{ accountKey: 'USD', amount: '0' }],
      user,
    });

    expect(fixture.transactionDTO.operations).toHaveLength(1);
  });

  it('applies domain invariants when building a transaction', () => {
    expect(() =>
      TransactionBuilder.transaction({
        accounts: ['USD'],
        commodity,
        operations: [{ accountKey: 'USD', amount: '0' }],
        user,
      }),
    ).toThrow(InsufficientOperationsError);
  });
});
