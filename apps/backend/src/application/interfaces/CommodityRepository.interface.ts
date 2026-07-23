import { UUID } from '@ledgerly/shared/types';
import { CommoditySnapshot } from 'src/domain/commodities';

export type CommodityRepositoryInterface = {
  getById(userId: UUID, commodityId: UUID): Promise<CommoditySnapshot>;
};
