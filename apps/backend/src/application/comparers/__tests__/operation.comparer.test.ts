import { UpdateOperationRequestDTO } from 'src/application/dto';
import {
  createAccount,
  createEntry,
  createTransaction,
  createUser,
} from 'src/db/createTestUser';
import { Account, Entry, Operation, Transaction, User } from 'src/domain';
import { Amount, Id } from 'src/domain/domain-core/value-objects';
import { beforeEach, describe, expect, it } from 'vitest';

import { compareOperation } from '../operation.comparer';

// TODO: move compareOperation tests here from operation.comparer.test.ts

describe('OperationComparer', () => {
  let user: User;
  let account: Account;
  let entry: Entry;
  let transaction: Transaction;

  beforeEach(async () => {
    user = await createUser();
    account = createAccount(user);

    transaction = createTransaction(user, {
      description: 'Test Transaction',
      postingDate: '2023-01-01',
      transactionDate: '2023-01-01',
    });

    entry = createEntry(user, transaction, []);
  });

  it('should return identical for identical operations', () => {
    const operation = Operation.create(
      user,
      account,
      entry,
      Amount.create('100'),
      'Test operation',
    );

    const incoming: UpdateOperationRequestDTO = {
      accountId: operation.getAccountId().valueOf(),
      amount: operation.amount.valueOf(),
      description: operation.description,
      entryId: entry.getId().valueOf(),
      id: operation.getId().valueOf(),
    };

    const compareResult = compareOperation(operation, incoming);

    expect(compareResult).toBe('identical');
  });

  it('should return different if amount is different', () => {
    const operation = Operation.create(
      user,
      account,
      entry,
      Amount.create('100'),
      'Test operation',
    );

    const incoming: UpdateOperationRequestDTO = {
      accountId: operation.getAccountId().valueOf(),
      amount: Amount.create('500').valueOf(), // Different amount
      description: operation.description,
      entryId: entry.getId().valueOf(),
      id: operation.getId().valueOf(),
    };

    const compareResult = compareOperation(operation, incoming);
    expect(compareResult).toBe('different');
  });

  it('should return different if account id is different', () => {
    const operation = Operation.create(
      user,
      account,
      entry,
      Amount.create('100'),
      'Test operation',
    );

    const incoming: UpdateOperationRequestDTO = {
      accountId: Id.create().valueOf(), // Different account id
      amount: Amount.create('100').valueOf(),
      description: operation.description,
      entryId: entry.getId().valueOf(),
      id: operation.getId().valueOf(),
    };

    const compareResult = compareOperation(operation, incoming);
    expect(compareResult).toBe('different');
  });

  it('should return different if description is different', () => {
    const operation = Operation.create(
      user,
      account,
      entry,
      Amount.create('100'),
      'Test operation',
    );

    const incoming: UpdateOperationRequestDTO = {
      accountId: operation.getAccountId().valueOf(),
      amount: Amount.create('100').valueOf(),
      description: 'Different description', // Different description
      entryId: entry.getId().valueOf(),
      id: operation.getId().valueOf(),
    };

    const compareResult = compareOperation(operation, incoming);
    expect(compareResult).toBe('different');
  });
});
