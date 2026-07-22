import { createAccount, createUser } from 'src/db/createTestUser';
import { Account, Operation, Transaction, User } from 'src/domain';
import {
  Amount,
  Currency,
  DateValue,
  Id,
  Timestamp,
  Version,
} from 'src/domain/domain-core';
import { describe, expect, it } from 'vitest';

const hasOwnPublicIdAccessor = (entity: object): boolean => 'id' in entity;

describe('domain entity identity API conventions', () => {
  it('exposes entity identity through getId() returning Id', async () => {
    const user = await createUser();
    const account = createAccount(user);
    const transaction = Transaction.restore({
      commodityId: Id.create().valueOf(),
      createdAt: Timestamp.create().valueOf(),
      currency: Currency.create('USD').valueOf(),
      description: 'Restored transaction',
      id: Id.create().valueOf(),
      isTombstone: false,
      operations: [],
      postingDate: DateValue.restore('2026-07-11').valueOf(),
      transactionDate: DateValue.restore('2026-07-11').valueOf(),
      updatedAt: Timestamp.create().valueOf(),
      userId: user.getId().valueOf(),
      version: Version.create(0).valueOf(),
    });
    const operation = Operation.create(
      user.getId(),
      account,
      transaction,
      Amount.create('10'),
      Amount.create('10'),
      'Identity API operation',
    );

    const entities = [user, account, operation, transaction];

    entities.forEach((entity) => {
      expect(entity.getId()).toBeInstanceOf(Id);
      expect(typeof entity.getId().valueOf()).toBe('string');
      expect(hasOwnPublicIdAccessor(entity)).toBe(false);
    });
  });

  it('keeps getId() as the consistent public identity method', () => {
    [User, Account, Operation, Transaction].forEach((constructor) => {
      expect(constructor.prototype).toHaveProperty('getId');
      expect(constructor.prototype).not.toHaveProperty('id');
    });
  });
});
