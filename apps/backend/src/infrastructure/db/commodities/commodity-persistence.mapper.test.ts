import { CommodityDbRow } from 'src/db/schema';
import { CommodityCode } from 'src/domain/domain-core';
import { Id } from 'src/domain/domain-core/value-objects/Id';
import { Timestamp } from 'src/domain/domain-core/value-objects/Timestamp';
import { describe, expect, it } from 'vitest';

import { CommodityPersistenceMapper } from './commodity-persistence.mapper';

describe('CommodityPersistenceMapper', () => {
  const row: CommodityDbRow = {
    code: CommodityCode.create('USD').valueOf(),
    createdAt: Timestamp.create().valueOf(),
    id: Id.create().valueOf(),
    isTombstone: false,
    name: 'US Dollar',
    precision: 2,
    symbol: '$',
    updatedAt: Timestamp.create().valueOf(),
    userId: Id.create().valueOf(),
  };

  it('maps a persistence row to a commodity snapshot explicitly', () => {
    expect(CommodityPersistenceMapper.toSnapshot(row)).toEqual({
      code: row.code,
      createdAt: row.createdAt,
      id: row.id,
      isTombstone: row.isTombstone,
      name: row.name,
      precision: row.precision,
      symbol: row.symbol,
      updatedAt: row.updatedAt,
      userId: row.userId,
    });
  });

  it('maps a persistence row to a domain commodity snapshot', () => {
    const commodity = CommodityPersistenceMapper.toDomain(row);

    expect(commodity.toSnapshot()).toEqual(
      CommodityPersistenceMapper.toSnapshot(row),
    );
  });

  it('maps a domain commodity snapshot to a persistence row', () => {
    const commodity = CommodityPersistenceMapper.toDomain(row);

    expect(
      CommodityPersistenceMapper.toDBRowFromSnapshot(commodity.toSnapshot()),
    ).toEqual({
      code: row.code,
      createdAt: row.createdAt,
      id: row.id,
      isTombstone: row.isTombstone,
      name: row.name,
      precision: row.precision,
      symbol: row.symbol,
      updatedAt: row.updatedAt,
      userId: row.userId,
    });
  });
});
