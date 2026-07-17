import { UUID } from '@ledgerly/shared/types';
import { and, eq } from 'drizzle-orm';
import { type CommodityRepositoryInterface } from 'src/application';
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
}
