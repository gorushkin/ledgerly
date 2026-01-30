import { createUser } from 'src/db/createTestUser';
import { describe, it } from 'vitest';

import { TransactionBuilder } from './testEntityBuilder';

describe('TransactionBuilder', () => {
  it('should be implemented', async () => {
    const user = await createUser();
    const transactionBuilder = TransactionBuilder.create();

    transactionBuilder
      .withUser(user)
      .withAccounts(['USD', 'EUR'])
      .withSystemAccounts()
      .withEntry('First Entry', [
        { accountKey: 'USD', amount: '10000', description: '1' },
        {
          accountKey: 'USD',
          amount: '-10000',
          description: '2',
        },
      ])
      .build();
  });
});
