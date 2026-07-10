import { AccountUpdateDTO } from '@ledgerly/shared/types';
import { AccountDbRow } from 'src/db/schema';
import { Amount, Currency, Id, Timestamp } from 'src/domain/domain-core';
import { describe, expect, it } from 'vitest';

import { AccountMapper } from './account.mapper';

describe('AccountMapper', () => {
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
    expect(AccountMapper.toSnapshot(row)).toEqual({
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
    const account = AccountMapper.toDomain(row);

    expect(account.toSnapshot()).toEqual(AccountMapper.toSnapshot(row));
  });

  it('maps a domain account to a persistence row', () => {
    const account = AccountMapper.toDomain(row);

    expect(AccountMapper.toDBRow(account.toSnapshot())).toEqual({
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

  it('maps a domain account to a response DTO', () => {
    const account = AccountMapper.toDomain(row);

    expect(AccountMapper.toResponseDTO(account.toSnapshot())).toEqual({
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

  it('maps a persistence row directly to a response DTO', () => {
    expect(AccountMapper.toResponseDTOFromRow(row)).toEqual({
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

  it('maps a full update DTO to domain update props', () => {
    const dto: AccountUpdateDTO = {
      currency: Currency.create('EUR').valueOf(),
      description: 'Updated description',
      isSystem: false,
      name: 'Updated Account',
      type: 'liability',
    };

    expect(AccountMapper.toUpdateProps(dto)).toEqual({
      currency: dto.currency,
      description: dto.description,
      name: dto.name,
      type: dto.type,
    });
  });

  it('preserves missing update fields as undefined', () => {
    const dto: AccountUpdateDTO = {
      name: 'Only Name Changed',
    };

    expect(AccountMapper.toUpdateProps(dto)).toEqual({
      currency: undefined,
      description: undefined,
      name: dto.name,
      type: undefined,
    });
  });
});
