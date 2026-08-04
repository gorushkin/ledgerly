import { CommodityDbInsert, CommodityDbRow } from 'src/db/schema';
import { Commodity } from 'src/domain';
import { CommoditySnapshot } from 'src/domain/commodities/types';

export class CommodityPersistenceMapper {
  static toDomain(row: CommodityDbRow): Commodity {
    return Commodity.restore(CommodityPersistenceMapper.toSnapshot(row));
  }

  static toSnapshot(row: CommodityDbRow): CommoditySnapshot {
    return {
      code: row.code,
      createdAt: row.createdAt,
      id: row.id,
      isClosed: row.isClosed,
      isTombstone: row.isTombstone,
      name: row.name,
      precision: row.precision,
      symbol: row.symbol,
      updatedAt: row.updatedAt,
      userId: row.userId,
    };
  }

  static toDBRowFromSnapshot(snapshot: CommoditySnapshot): CommodityDbInsert {
    return {
      code: snapshot.code,
      createdAt: snapshot.createdAt,
      id: snapshot.id,
      isClosed: snapshot.isClosed,
      isTombstone: snapshot.isTombstone,
      name: snapshot.name,
      precision: snapshot.precision,
      symbol: snapshot.symbol,
      updatedAt: snapshot.updatedAt,
      userId: snapshot.userId,
    };
  }
}
