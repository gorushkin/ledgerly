import { createUser } from 'src/db/createTestUser';
import { Amount } from 'src/domain/domain-core';
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
        { accountKey: 'USD', amount: Amount.create('0'), description: '' },
      ])
      .build();
  });
});
