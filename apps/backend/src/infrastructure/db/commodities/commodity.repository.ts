import { UUID } from '@ledgerly/shared/types';
import { CommodityQuery } from '@ledgerly/shared/validation';
import { and, eq } from 'drizzle-orm';
import {
  type CommodityLifecycleAction,
  type CommodityLifecycleUpdateInput,
  type CommodityRepositoryInterface,
  type CommodityRepositoryLifecycleInput,
  type CommodityRepositoryUpdateInput,
  type CommodityRepositorySoftDeleteInput,
} from 'src/application';
import { commoditiesTable } from 'src/db/schemas/commodities';
import { CommoditySnapshot } from 'src/domain/commodities/types';
import {
  RepositoryInvariantError,
  RepositoryNotFoundError,
} from 'src/infrastructure/errors';

import { BaseRepository } from '../BaseRepository';

import { CommodityPersistenceMapper } from './commodity-persistence.mapper';

const getWhereClauseForGetAll = (userId: UUID, query: CommodityQuery) => {
  const { status } = query;

  if (status === 'all') {
    return and(
      eq(commoditiesTable.userId, userId),
      eq(commoditiesTable.isTombstone, false),
    );
  }

  return and(
    eq(commoditiesTable.userId, userId),
    eq(commoditiesTable.isClosed, status !== 'open'),
    eq(commoditiesTable.isTombstone, false),
  );
};

const getWhereClauseForGetByIdInternal = (
  userId: UUID,
  id: UUID,
  options: { includeTombstone: boolean },
) => {
  if (options.includeTombstone) {
    return and(
      eq(commoditiesTable.userId, userId),
      eq(commoditiesTable.id, id),
    );
  }

  return and(
    eq(commoditiesTable.userId, userId),
    eq(commoditiesTable.id, id),
    eq(commoditiesTable.isTombstone, false),
  );
};

const lifecycleMapper: Record<
  CommodityLifecycleAction,
  { name: string; params: Record<string, boolean> }
> = {
  close: { name: 'close', params: { isClosed: true } },
  open: { name: 'open', params: { isClosed: false } },
};

export class CommodityRepository
  extends BaseRepository
  implements CommodityRepositoryInterface
{
  private commodityNotFoundError(id: UUID): RepositoryNotFoundError {
    return new RepositoryNotFoundError(
      `Commodity with ID ${id} not found`,
      this.entityNotFoundContext('commodity', id),
    );
  }

  private getByIdInternal(
    userId: UUID,
    id: UUID,
    options: { includeTombstone: boolean },
  ): Promise<CommoditySnapshot> {
    return this.executeDatabaseOperation(async () => {
      const whereClause = getWhereClauseForGetByIdInternal(userId, id, options);

      const commodity = await this.db
        .select()
        .from(commoditiesTable)
        .where(whereClause)
        .get();

      const existingCommodity = this.ensureEntityExists(
        commodity,
        `Commodity with ID ${id} not found`,
        this.entityNotFoundContext('commodity', id),
      );

      return CommodityPersistenceMapper.toSnapshot(existingCommodity);
    }, 'Failed to fetch commodity');
  }

  getByIdForLifecycle(userId: UUID, id: UUID): Promise<CommoditySnapshot> {
    return this.getByIdInternal(userId, id, { includeTombstone: true });
  }

  getById(userId: UUID, id: UUID): Promise<CommoditySnapshot> {
    return this.getByIdInternal(userId, id, { includeTombstone: false });
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

  create(userId: UUID, commodity: CommoditySnapshot): Promise<void> {
    return this.executeDatabaseOperation(
      async () => {
        if (commodity.userId !== userId) {
          throw new RepositoryInvariantError(
            'Commodity snapshot userId must match repository create userId',
          );
        }

        const commodityRow =
          CommodityPersistenceMapper.toDBRowFromSnapshot(commodity);

        await this.db
          .insert(commoditiesTable)
          .values(commodityRow)
          .returning()
          .get();
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
  ): Promise<void> {
    return this.executeDatabaseOperation(
      async () => {
        const safeData = this.getSafeUpdate(commodity, [
          'code',
          'symbol',
          'name',
          'updatedAt',
        ]);

        const result = await this.db
          .update(commoditiesTable)
          .set(safeData)
          .where(
            and(
              eq(commoditiesTable.userId, userId),
              eq(commoditiesTable.id, commodityId),
              eq(commoditiesTable.isTombstone, false),
            ),
          );

        this.ensureRowsAffected(
          result.rowsAffected,
          this.commodityNotFoundError(commodityId),
        );
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
  ): Promise<void> {
    return this.executeDatabaseOperation(async () => {
      const result = await this.db
        .update(commoditiesTable)
        .set({ isTombstone: true, updatedAt: data.updatedAt })
        .where(
          and(
            eq(commoditiesTable.userId, userId),
            eq(commoditiesTable.id, commodityId),
            eq(commoditiesTable.isTombstone, false),
          ),
        );

      this.ensureRowsAffected(
        result.rowsAffected,
        this.commodityNotFoundError(commodityId),
      );
    }, `Failed to soft delete commodity with ID ${commodityId}`);
  }

  private updateLifecycle(
    userId: UUID,
    commodityId: UUID,
    data: CommodityLifecycleUpdateInput,
  ): Promise<void> {
    const { action, updatedAt } = data;
    const { name, params } = lifecycleMapper[action];
    const targetIsClosed = params.isClosed;

    return this.executeDatabaseOperation<void>(async () => {
      const commodity = await this.db
        .select()
        .from(commoditiesTable)
        .where(
          and(
            eq(commoditiesTable.userId, userId),
            eq(commoditiesTable.id, commodityId),
            eq(commoditiesTable.isTombstone, false),
          ),
        )
        .get();

      const existingCommodity = this.ensureEntityExists(
        commodity,
        `Commodity with ID ${commodityId} not found`,
        this.entityNotFoundContext('commodity', commodityId),
      );

      if (existingCommodity.isClosed === targetIsClosed) {
        return;
      }

      const result = await this.db
        .update(commoditiesTable)
        .set({ ...params, updatedAt })
        .where(
          and(
            eq(commoditiesTable.userId, userId),
            eq(commoditiesTable.id, commodityId),
            eq(commoditiesTable.isTombstone, false),
          ),
        );

      this.ensureRowsAffected(
        result.rowsAffected,
        this.commodityNotFoundError(commodityId),
      );
    }, `Failed to ${name} commodity with ID ${commodityId}`);
  }

  open(
    userId: UUID,
    commodityId: UUID,
    data: CommodityRepositoryLifecycleInput,
  ): Promise<void> {
    return this.updateLifecycle(userId, commodityId, {
      action: 'open',
      updatedAt: data.updatedAt,
    });
  }

  close(
    userId: UUID,
    commodityId: UUID,
    data: CommodityRepositoryLifecycleInput,
  ): Promise<void> {
    return this.updateLifecycle(userId, commodityId, {
      action: 'close',
      updatedAt: data.updatedAt,
    });
  }
}
