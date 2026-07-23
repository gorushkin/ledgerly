import { createUser } from 'src/db/createTestUser';
import { User } from 'src/domain';
import { InsufficientOperationsError } from 'src/domain/domain.errors';
import { beforeAll, describe, expect, it } from 'vitest';

import { EntityNotFoundError } from '../../application/application.errors';

import { TransactionBuilder } from './testEntityBuilder';

describe('TransactionBuilder', () => {
  let user: User;

  beforeAll(async () => {
    user = await createUser();
  });

  it('should be implemented', () => {
    TransactionBuilder.transaction({
      currencies: ['USD', 'EUR'],
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
      currencies: ['USD'],
      operations: [{ accountKey: 'USD', amount: '0' }],
      user,
    });

    expect(fixture.transactionDTO.operations).toHaveLength(1);
  });

  it('applies domain invariants when building a transaction', () => {
    expect(() =>
      TransactionBuilder.transaction({
        currencies: ['USD'],
        operations: [{ accountKey: 'USD', amount: '0' }],
        user,
      }),
    ).toThrow(InsufficientOperationsError);
  });

  it('throws an error if an operation references a non-existent account', () => {
    expect(() =>
      TransactionBuilder.transaction({
        currencies: ['USD'],
        operations: [
          { accountKey: 'USD', amount: '100', description: 'Debit' },
          { accountKey: 'EUR', amount: '-100', description: 'Credit' },
        ],
        user,
      }),
    ).toThrow(EntityNotFoundError);
  });
});
