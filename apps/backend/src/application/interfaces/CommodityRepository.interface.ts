import { IsoDatetimeString, UUID } from '@ledgerly/shared/types';
import { CommodityQuery } from '@ledgerly/shared/validation';
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

export type CommodityRepositoryLifecycleInput = {
  updatedAt: IsoDatetimeString;
};

export type CommodityLifecycleAction = 'close' | 'open';

export type CommodityLifecycleUpdateInput =
  CommodityRepositoryLifecycleInput & {
    action: CommodityLifecycleAction;
  };

export type CommodityRepositoryInterface = {
  getById(userId: UUID, commodityId: UUID): Promise<CommoditySnapshot>;
  getAll(userId: UUID, status: CommodityQuery): Promise<CommoditySnapshot[]>;
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
  open(
    userId: UUID,
    commodityId: UUID,
    data: CommodityRepositoryLifecycleInput,
  ): Promise<CommoditySnapshot>;
  close(
    userId: UUID,
    commodityId: UUID,
    data: CommodityRepositoryLifecycleInput,
  ): Promise<CommoditySnapshot>;
};
