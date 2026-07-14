import { AccountDbRow } from 'src/db/schema';
import { Amount, Currency, Id, Timestamp } from 'src/domain/domain-core';
import { describe, expect, it } from 'vitest';

import { AccountPersistenceMapper } from './account-persistence.mapper';

describe('AccountPersistenceMapper', () => {
  const row: AccountDbRow = {
    createdAt: Timestamp.create().valueOf(),
    currency: Currency.create('USD').valueOf(),
    currentClearedBalanceLocal: Amount.create('2500').valueOf(),
    description: 'Operating account',
    id: Id.create().valueOf(),
    initialBalance: Amount.create('1000').valueOf(),
    isSystem: true,
    isTombstone: false,
    name: 'Primary Checking',
    type: 'asset',
    updatedAt: Timestamp.create().valueOf(),
    userId: Id.create().valueOf(),
  };

  it('maps a persistence row to an account snapshot explicitly', () => {
    expect(AccountPersistenceMapper.toSnapshot(row)).toEqual({
      createdAt: row.createdAt,
      currency: row.currency,
      currentClearedBalanceLocal: row.currentClearedBalanceLocal,
      description: row.description,
      id: row.id,
      initialBalance: row.initialBalance,
      isSystem: row.isSystem,
      isTombstone: row.isTombstone,
      name: row.name,
      type: row.type,
      updatedAt: row.updatedAt,
      userId: row.userId,
    });
  });

  it('maps a persistence row to a domain account snapshot', () => {
    const account = AccountPersistenceMapper.toDomain(row);

    expect(account.toSnapshot()).toEqual(
      AccountPersistenceMapper.toSnapshot(row),
    );
  });

  it('maps a domain account snapshot to a persistence row', () => {
    const account = AccountPersistenceMapper.toDomain(row);

    expect(
      AccountPersistenceMapper.toDBRowFromSnapshot(account.toSnapshot()),
    ).toEqual({
      createdAt: row.createdAt,
      currency: row.currency,
      currentClearedBalanceLocal: row.currentClearedBalanceLocal,
      description: row.description,
      id: row.id,
      initialBalance: row.initialBalance,
      isSystem: row.isSystem,
      isTombstone: row.isTombstone,
      name: row.name,
      type: row.type,
      updatedAt: row.updatedAt,
      userId: row.userId,
    });
  });
});
