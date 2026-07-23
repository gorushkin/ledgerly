import { UUID } from '@ledgerly/shared/types';
import { CommoditySnapshot } from 'src/domain/commodities';

export type CommodityRepositoryUpdateInput = Pick<
  CommoditySnapshot,
  'updatedAt'
> &
  Partial<Pick<CommoditySnapshot, 'code' | 'symbol' | 'name'>>;

export type CommodityRepositorySoftDeleteInput = Pick<
  CommoditySnapshot,
  'updatedAt'
>;

export type CommodityRepositoryInterface = {
  getById(userId: UUID, commodityId: UUID): Promise<CommoditySnapshot>;
  getAll(userId: UUID): Promise<CommoditySnapshot[]>;
  create(
    userId: UUID,
    commodity: CommoditySnapshot,
  ): Promise<CommoditySnapshot>;
  update(
    userId: UUID,
    commodityId: UUID,
    commodity: CommodityRepositoryUpdateInput,
  ): Promise<CommoditySnapshot>;
  delete(
    userId: UUID,
    commodityId: UUID,
    data: CommodityRepositorySoftDeleteInput,
  ): Promise<CommoditySnapshot>;
};
