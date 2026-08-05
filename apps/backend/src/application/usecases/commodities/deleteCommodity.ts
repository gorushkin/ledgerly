import { UUID } from '@ledgerly/shared/types';
import {
  CommodityRepositoryInterface,
  TransactionManagerInterface,
} from 'src/application/interfaces';
import { CommodityReferencePolicy } from 'src/application/services';
import { EnsureOwnedSnapshotFn } from 'src/application/shared/ensureOwnedSnapshot';
import { Commodity, CommoditySnapshot } from 'src/domain/commodities';
import { User } from 'src/domain/users/user.entity';

export class DeleteCommodityUseCase {
  constructor(
    protected readonly commodityRepository: CommodityRepositoryInterface,
    protected readonly ensureOwnedSnapshot: EnsureOwnedSnapshotFn,
    private readonly commodityReferencePolicy: CommodityReferencePolicy,
    private readonly transactionManager: TransactionManagerInterface,
  ) {}

  async execute(user: User, commodityId: UUID): Promise<void> {
    await this.transactionManager.run(async () => {
      const commodityData = await this.ensureOwnedSnapshot<CommoditySnapshot>({
        entityId: commodityId,
        entityType: Commodity.entityType,
        getOwnerId: (commodity) => commodity.userId,
        load: this.commodityRepository.getByIdForLifecycle.bind(
          this.commodityRepository,
        ),
        user,
      });

      const commodity = Commodity.restore(commodityData);

      await this.commodityReferencePolicy.assertNoActiveReferences(
        user.getId().valueOf(),
        commodityId,
      );

      const result = commodity.delete();

      if (result === 'changed') {
        await this.commodityRepository.delete(
          user.getId().valueOf(),
          commodityId,
          {
            updatedAt: commodity.getUpdatedAt().valueOf(),
          },
        );
      }
    });
  }
}
