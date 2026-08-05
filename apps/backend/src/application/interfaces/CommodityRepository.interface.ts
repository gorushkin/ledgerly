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
  getByIdForLifecycle(
    userId: UUID,
    commodityId: UUID,
  ): Promise<CommoditySnapshot>;
  getAll(userId: UUID, status: CommodityQuery): Promise<CommoditySnapshot[]>;
  create(userId: UUID, commodity: CommoditySnapshot): Promise<void>;
  update(
    userId: UUID,
    commodityId: UUID,
    commodity: CommodityRepositoryUpdateInput,
  ): Promise<void>;
  delete(
    userId: UUID,
    commodityId: UUID,
    data: CommodityRepositorySoftDeleteInput,
  ): Promise<void>;
  open(
    userId: UUID,
    commodityId: UUID,
    data: CommodityRepositoryLifecycleInput,
  ): Promise<void>;
  close(
    userId: UUID,
    commodityId: UUID,
    data: CommodityRepositoryLifecycleInput,
  ): Promise<void>;
};
