import { UUID } from '@ledgerly/shared/types';
import { CommodityClosedError } from 'src/application/application.errors';
import type { CommodityRepositoryInterface } from 'src/application/interfaces';
import { Commodity } from 'src/domain/commodities';
import { DeletedEntityOperationError } from 'src/domain/domain.errors';

export class CommodityReferencePolicy {
  constructor(
    private readonly commodityRepository: CommodityRepositoryInterface,
  ) {}

  async assertUsableForNewAccount(
    userId: UUID,
    commodityId: UUID,
  ): Promise<void> {
    const commoditySnapshot = await this.commodityRepository.getById(
      userId,
      commodityId,
    );

    const commodity = Commodity.restore(commoditySnapshot);

    if (commodity.isDeleted()) {
      throw DeletedEntityOperationError.forUse(Commodity.entityType);
    }

    if (commodity.closed) {
      throw new CommodityClosedError(commodityId, 'create_account');
    }
  }
}
