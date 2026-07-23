import { AccountUpdateDTO } from '@ledgerly/shared/types';
import { AccountSnapshot } from 'src/domain/accounts';
import { Amount, Id, Timestamp } from 'src/domain/domain-core';
import { describe, expect, it } from 'vitest';

import { AccountMapper } from './account.mapper';

describe('AccountMapper', () => {
  const snapshot: AccountSnapshot = {
    commodityId: Id.create().valueOf(),
    createdAt: Timestamp.create().valueOf(),
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

  it('maps an account snapshot to a response DTO', () => {
    expect(AccountMapper.toResponseDTOFromSnapshot(snapshot)).toEqual({
      commodityId: snapshot.commodityId,
      createdAt: snapshot.createdAt,
      currentClearedBalanceLocal: snapshot.currentClearedBalanceLocal,
      description: snapshot.description,
      id: snapshot.id,
      initialBalance: snapshot.initialBalance,
      isSystem: snapshot.isSystem,
      isTombstone: snapshot.isTombstone,
      name: snapshot.name,
      type: snapshot.type,
      updatedAt: snapshot.updatedAt,
      userId: snapshot.userId,
    });
  });

  it('maps a full update DTO to domain update props', () => {
    const dto: AccountUpdateDTO = {
      description: 'Updated description',
      name: 'Updated Account',
      type: 'liability',
    };

    expect(AccountMapper.toUpdateProps(dto)).toEqual({
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
      description: undefined,
      name: dto.name,
      type: undefined,
    });
  });
});
