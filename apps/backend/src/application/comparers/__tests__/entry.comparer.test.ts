import { UpdateEntryRequestDTO } from 'src/application/dto';
import {
  createUser,
  createTransaction,
  createEntry,
  createAccount,
  createOperation,
} from 'src/db/createTestUser';
import { User, Entry, Transaction, Account } from 'src/domain';
import { Amount, Id } from 'src/domain/domain-core/value-objects';
import { beforeEach, describe, expect, it } from 'vitest';

import { compareEntry } from '../entry.comparer';

describe('compareEntry', () => {
  let user: User;
  let entry: Entry;
  let transaction: Transaction;
  let account1: Account;
  let account2: Account;

  beforeEach(async () => {
    user = await createUser();

    transaction = createTransaction(user, {
      description: 'Test Transaction',
      postingDate: '2023-01-01',
      transactionDate: '2023-01-01',
    });

    entry = createEntry(user, transaction, []);

    account1 = createAccount(user);
    account2 = createAccount(user);

    const operation1 = createOperation(
      user,
      account1,
      entry,
      Amount.create('100'),
      'Test Operation 1',
    );

    const operation2 = createOperation(
      user,
      account2,
      entry,
      Amount.create('-100'),
      'Test Operation 2',
    );

    entry.addOperations([operation1, operation2]);
  });

  it('should return updatedMetadata when only description changes', () => {
    const incoming: UpdateEntryRequestDTO = {
      description: 'Changed description',
      id: entry.getId().valueOf(),
    };

    expect(compareEntry(entry, incoming)).toBe('updatedMetadata');
  });

  it('should return updatedFinancial when only operations change', () => {
    const origOps = entry.getOperations();

    const incoming: UpdateEntryRequestDTO = {
      description: entry.description,
      id: entry.getId().valueOf(),
      operations: [
        {
          accountId: origOps[0].getAccountId().valueOf(),
          amount: Amount.create('999').valueOf(), // changed amount
          description: origOps[0].description,
        },
        {
          accountId:
            origOps[1]?.getAccountId().valueOf() || Id.create().valueOf(),
          amount:
            origOps[1]?.amount.valueOf() || Amount.create('-999').valueOf(),
          description: origOps[1]?.description || 'op2',
        },
      ],
    };

    expect(compareEntry(entry, incoming)).toBe('updatedFinancial');
  });

  it('should return updatedBoth when both description and operations change', () => {
    const origOps = entry.getOperations();

    const incoming: UpdateEntryRequestDTO = {
      description: 'Changed description',
      id: entry.getId().valueOf(),
      operations: [
        {
          accountId: origOps[0].getAccountId().valueOf(),
          amount: Amount.create('999').valueOf(), // changed amount
          description: origOps[0].description,
        },
        {
          accountId:
            origOps[1]?.getAccountId().valueOf() || Id.create().valueOf(),
          amount:
            origOps[1]?.amount.valueOf() || Amount.create('-999').valueOf(),
          description: origOps[1]?.description || 'op2',
        },
      ],
    };

    expect(compareEntry(entry, incoming)).toBe('updatedBoth');
  });

  it('should return unchanged when there are no changes', () => {
    const incoming: UpdateEntryRequestDTO = {
      description: entry.description,
      id: entry.getId().valueOf(),
    };

    expect(compareEntry(entry, incoming)).toBe('unchanged');
  });
});
