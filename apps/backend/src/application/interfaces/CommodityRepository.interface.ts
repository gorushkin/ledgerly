import { UUID } from '@ledgerly/shared/types';
import { CommoditySnapshot } from 'src/domain/commodities';

export type CommodityRepositoryInterface = {
  getById(userId: string, commodityId: UUID): Promise<CommoditySnapshot>;
};
