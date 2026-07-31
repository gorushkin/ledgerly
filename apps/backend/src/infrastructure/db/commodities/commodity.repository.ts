import { UUID } from '@ledgerly/shared/types';
import { CommodityQuery } from '@ledgerly/shared/validation';
import { and, eq } from 'drizzle-orm';
import {
  type CommodityRepositoryInterface,
  type CommodityRepositoryUpdateInput,
  type CommodityRepositorySoftDeleteInput,
} from 'src/application';
import { commoditiesTable } from 'src/db/schemas/commodities';
import { CommoditySnapshot } from 'src/domain/commodities/types';
import { RepositoryInvariantError } from 'src/infrastructure/errors';

import { BaseRepository } from '../BaseRepository';

import { CommodityPersistenceMapper } from './commodity-persistence.mapper';

const getWhereClauseForGetAll = (userId: UUID, query: CommodityQuery) => {
  const { status } = query;

  if (status === 'all') {
    return eq(commoditiesTable.userId, userId);
  }

  return and(
    eq(commoditiesTable.userId, userId),
    eq(commoditiesTable.isTombstone, status === 'archived'),
  );
};

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

  getAll(userId: UUID, query: CommodityQuery): Promise<CommoditySnapshot[]> {
    return this.executeDatabaseOperation(async () => {
      const whereClause = getWhereClauseForGetAll(userId, query);

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

  create(
    userId: UUID,
    commodity: CommoditySnapshot,
  ): Promise<CommoditySnapshot> {
    return this.executeDatabaseOperation(
      async () => {
        if (commodity.userId !== userId) {
          throw new RepositoryInvariantError(
            'Commodity snapshot userId must match repository create userId',
          );
        }

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

  softDelete(
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
    }, `Failed to soft delete commodity with ID ${commodityId}`);
  }
}
