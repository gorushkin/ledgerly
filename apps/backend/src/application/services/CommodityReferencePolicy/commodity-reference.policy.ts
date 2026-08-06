import { UUID } from '@ledgerly/shared/types';
import {
  CommodityClosedError,
  CommodityHasActiveReferencesError,
} from 'src/application/application.errors';
import type {
  AccountRepositoryInterface,
  CommodityRepositoryInterface,
  TransactionRepositoryInterface,
} from 'src/application/interfaces';
import { Commodity } from 'src/domain/commodities';
import { DeletedEntityOperationError } from 'src/domain/domain.errors';

export class CommodityReferencePolicy {
  constructor(
    private readonly commodityRepository: CommodityRepositoryInterface,
    private readonly accountRepository: AccountRepositoryInterface,
    private readonly transactionRepository: TransactionRepositoryInterface,
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

  async assertNoActiveReferences(
    userId: UUID,
    commodityId: UUID,
  ): Promise<void> {
    const hasActiveAccountReferences =
      await this.accountRepository.existsActiveByCommodityId(
        userId,
        commodityId,
      );

    if (hasActiveAccountReferences) {
      throw new CommodityHasActiveReferencesError(commodityId);
    }

    const hasActiveTransactionReferences =
      await this.transactionRepository.existsActiveByCommodityId(
        userId,
        commodityId,
      );

    if (hasActiveTransactionReferences) {
      throw new CommodityHasActiveReferencesError(commodityId);
    }
  }
}
