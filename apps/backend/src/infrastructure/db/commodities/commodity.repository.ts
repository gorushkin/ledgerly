import { QueryStatus, UUID } from '@ledgerly/shared/types';
import { and, eq } from 'drizzle-orm';
import {
  type CommodityRepositoryInterface,
  type CommodityRepositoryUpdateInput,
  type CommodityRepositorySoftDeleteInput,
} from 'src/application';
import { commoditiesTable } from 'src/db/schemas/commodities';
import { CommoditySnapshot } from 'src/domain/commodities/types';

import { BaseRepository } from '../BaseRepository';

import { CommodityPersistenceMapper } from './commodity-persistence.mapper';

export class CommodityRepository
  extends BaseRepository
  implements CommodityRepositoryInterface
{
  getById(userId: UUID, id: UUID): Promise<CommoditySnapshot> {
    return this.executeDatabaseOperation(async () => {
      const commodity = await this.db
        .select()
        .from(commoditiesTable)
        .where(
          and(eq(commoditiesTable.userId, userId), eq(commoditiesTable.id, id)),
        )
        .get();

      const existingCommodity = this.ensureEntityExists(
        commodity,
        `Commodity with ID ${id} not found`,
        this.entityNotFoundContext('commodity', id),
      );

      return CommodityPersistenceMapper.toSnapshot(existingCommodity);
    }, 'Failed to fetch commodity');
  }

  getAll(userId: UUID, status: QueryStatus): Promise<CommoditySnapshot[]> {
    return this.executeDatabaseOperation(async () => {
      const whereClause =
        status === 'all'
          ? eq(commoditiesTable.userId, userId)
          : and(
              eq(commoditiesTable.userId, userId),
              eq(commoditiesTable.isTombstone, status === 'archived'),
            );

      const commodities = await this.db
        .select()
        .from(commoditiesTable)
        .where(whereClause)
        .all();

      return commodities.map((commodity) =>
        CommodityPersistenceMapper.toSnapshot(commodity),
      );
    }, 'Failed to fetch commodities');
  }

  create(commodity: CommoditySnapshot): Promise<CommoditySnapshot> {
    return this.executeDatabaseOperation(
      async () => {
        const commodityRow =
          CommodityPersistenceMapper.toDBRowFromSnapshot(commodity);

        const createdCommodity = await this.db
          .insert(commoditiesTable)
          .values(commodityRow)
          .returning()
          .get();

        return CommodityPersistenceMapper.toSnapshot(createdCommodity);
      },
      'Failed to create commodity',
      {
        unique: {
          field: 'code',
          tableName: 'commodities',
          value: commodity.code,
        },
      },
    );
  }

  update(
    userId: UUID,
    commodityId: UUID,
    commodity: CommodityRepositoryUpdateInput,
  ): Promise<CommoditySnapshot> {
    return this.executeDatabaseOperation(
      async () => {
        const safeData = this.getSafeUpdate(commodity, [
          'code',
          'symbol',
          'name',
          'updatedAt',
        ]);

        const updatedCommodity = await this.db
          .update(commoditiesTable)
          .set(safeData)
          .where(
            and(
              eq(commoditiesTable.userId, userId),
              eq(commoditiesTable.id, commodityId),
              eq(commoditiesTable.isTombstone, false),
            ),
          )
          .returning()
          .get();

        const existingCommodity = this.ensureEntityExists(
          updatedCommodity,
          `Commodity with ID ${commodityId} not found`,
          this.entityNotFoundContext('commodity', commodityId),
        );

        return CommodityPersistenceMapper.toSnapshot(existingCommodity);
      },
      'Failed to update commodity',
      {
        unique: {
          field: 'code',
          tableName: 'commodities',
          value: commodity.code,
        },
      },
    );
  }

  delete(
    userId: UUID,
    commodityId: UUID,
    data: CommodityRepositorySoftDeleteInput,
  ): Promise<CommoditySnapshot> {
    return this.executeDatabaseOperation(async () => {
      const deletedCommodity = await this.db
        .update(commoditiesTable)
        .set({ isTombstone: true, updatedAt: data.updatedAt })
        .where(
          and(
            eq(commoditiesTable.userId, userId),
            eq(commoditiesTable.id, commodityId),
            eq(commoditiesTable.isTombstone, false),
          ),
        )
        .returning()
        .get();

      const existingCommodity = this.ensureEntityExists(
        deletedCommodity,
        `Commodity with ID ${commodityId} not found after deletion`,
        this.entityNotFoundContext('commodity', commodityId),
      );

      return CommodityPersistenceMapper.toSnapshot(existingCommodity);
    }, 'Failed to delete commodity');
  }
}
