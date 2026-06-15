import { createUser } from 'src/db/createTestUser';
import { InsufficientOperationsError } from 'src/domain/domain.errors';
import { describe, expect, it } from 'vitest';

import { TransactionBuilder } from './testEntityBuilder';

describe('TransactionBuilder', () => {
  it('should be implemented', async () => {
    const user = await createUser();
    TransactionBuilder.transaction({
      accounts: ['USD', 'EUR'],
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

  it('builds an invalid request fixture without creating a domain transaction', async () => {
    const user = await createUser();
    const fixture = TransactionBuilder.request({
      accounts: ['USD'],
      operations: [{ accountKey: 'USD', amount: '0' }],
      user,
    });

    expect(fixture.transactionDTO.operations).toHaveLength(1);
  });

  it('applies domain invariants when building a transaction', async () => {
    const user = await createUser();

    expect(() =>
      TransactionBuilder.transaction({
        accounts: ['USD'],
        operations: [{ accountKey: 'USD', amount: '0' }],
        user,
      }),
    ).toThrow(InsufficientOperationsError);
  });
});
