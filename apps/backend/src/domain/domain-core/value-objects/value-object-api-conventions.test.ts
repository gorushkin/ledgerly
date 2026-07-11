import { describe, expect, it } from 'vitest';

import { AccountType } from '../../accounts';
import { EntityIdentity, EntityTimestamps, SoftDelete } from '../behaviors';

import { Amount } from './Amount';
import { Currency } from './Currency';
import { DateValue } from './DateValue';
import { Email } from './Email';
import { Id } from './Id';
import { Money } from './Money';
import { Name } from './Name';
import { ParentChildRelation } from './ParentChildRelation';
import { Password } from './Password';
import { Timestamp } from './Timestamp';
import { Version } from './Version';

describe('value object API conventions', () => {
  it('restores persisted/plain values through restore()', () => {
    const id = '11111111-1111-4111-8111-111111111111';
    const usd = Currency.create('USD').valueOf();

    expect(Amount.restore('1200').valueOf()).toBe('1200');
    expect(Currency.restore('USD').valueOf()).toBe('USD');
    expect(DateValue.restore('2026-07-10').valueOf()).toBe('2026-07-10');
    expect(Email.restore('user@example.com').valueOf()).toBe(
      'user@example.com',
    );
    expect(Id.restore(id).valueOf()).toBe(id);
    expect(Money.restore('1200', usd).toPersistence()).toEqual({
      amount: '1200',
      currency: usd,
    });
    expect(Name.restore('Restored Name').valueOf()).toBe('Restored Name');
    expect(Password.restore('$2hashed-password').valueOf()).toBe(
      '$2hashed-password',
    );
    expect(Timestamp.restore('2026-07-10T10:00:00.000Z').valueOf()).toBe(
      '2026-07-10T10:00:00.000Z',
    );
    expect(Version.restore(3).valueOf()).toBe(3);
    expect(AccountType.restore('asset').valueOf()).toBe('asset');
  });

  it('compares value objects through equals()', () => {
    const parentId = Id.restore('11111111-1111-4111-8111-111111111111');
    const childId = Id.restore('22222222-2222-4222-8222-222222222222');
    const usd = Currency.create('USD').valueOf();

    expect(Amount.create('1200').equals(Amount.restore('1200'))).toBe(true);
    expect(Currency.create('usd').equals(Currency.restore('USD'))).toBe(true);
    expect(
      DateValue.restore('2026-07-10').equals(DateValue.restore('2026-07-10')),
    ).toBe(true);
    expect(
      Email.create('USER@example.com').equals(
        Email.restore('user@example.com'),
      ),
    ).toBe(true);
    expect(Id.restore(parentId.valueOf()).equals(parentId)).toBe(true);
    expect(Money.create('1200', usd).equals(Money.restore('1200', usd))).toBe(
      true,
    );
    expect(
      Name.create('Restored Name').equals(Name.restore('Restored Name')),
    ).toBe(true);
    expect(
      ParentChildRelation.create(parentId, childId).equals(
        ParentChildRelation.create(parentId, childId),
      ),
    ).toBe(true);
    expect(
      Timestamp.restore('2026-07-10T10:00:00.000Z').equals(
        Timestamp.restore('2026-07-10T10:00:00.000Z'),
      ),
    ).toBe(true);
    expect(Version.create(3).equals(Version.restore(3))).toBe(true);
    expect(
      AccountType.create('asset').equals(AccountType.restore('asset')),
    ).toBe(true);
  });

  it('does not expose domain fromPersistence restoration aliases', () => {
    const constructors = [
      Amount,
      Currency,
      Email,
      Id,
      Money,
      Name,
      Password,
      EntityIdentity,
      EntityTimestamps,
      SoftDelete,
    ];

    constructors.forEach((constructor) => {
      expect('fromPersistence' in constructor).toBe(false);
    });
  });

  it('freezes immutable value objects at runtime', async () => {
    const parentId = Id.restore('11111111-1111-4111-8111-111111111111');
    const childId = Id.restore('22222222-2222-4222-8222-222222222222');
    const usd = Currency.create('USD').valueOf();

    const valueObjects = [
      Amount.create('1200'),
      Amount.restore('1200'),
      Currency.create('usd'),
      Currency.restore('USD'),
      DateValue.create(),
      DateValue.restore('2026-07-10'),
      Email.create('USER@example.com'),
      Email.restore('user@example.com'),
      Id.create(),
      Id.restore(parentId.valueOf()),
      Money.create('1200', usd),
      Money.restore('1200', usd),
      Name.create('Restored Name'),
      Name.restore('Restored Name'),
      ParentChildRelation.create(parentId, childId),
      Password.restore('$2hashed-password'),
      await Password.create('ValidPassword123!'),
      Timestamp.create(),
      Timestamp.restore('2026-07-10T10:00:00.000Z'),
      Version.create(3),
      Version.restore(3),
      AccountType.create('asset'),
      AccountType.restore('asset'),
    ];

    valueObjects.forEach((valueObject) => {
      expect(Object.isFrozen(valueObject)).toBe(true);
    });
  });
});
