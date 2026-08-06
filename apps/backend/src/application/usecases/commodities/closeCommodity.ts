import { CommodityResponseDTO, UUID } from '@ledgerly/shared/types';
import { CommodityMapper } from 'src/application';
import { EntityNotFoundError } from 'src/application/application.errors';
import {
  CommodityRepositoryInterface,
  TransactionManagerInterface,
} from 'src/application/interfaces';
import { EnsureOwnedSnapshotFn } from 'src/application/shared/ensureOwnedSnapshot';
import { Commodity, CommoditySnapshot } from 'src/domain/commodities';
import { User } from 'src/domain/users/user.entity';

export class CloseCommodityUseCase {
  constructor(
    protected readonly commodityRepository: CommodityRepositoryInterface,
    protected readonly ensureOwnedSnapshot: EnsureOwnedSnapshotFn,
    private readonly transactionManager: TransactionManagerInterface,
  ) {}

  async execute(user: User, commodityId: UUID): Promise<CommodityResponseDTO> {
    const commoditySnapshot = await this.transactionManager.run(async () => {
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

      if (commodity.isDeleted()) {
        throw new EntityNotFoundError({
          entityId: commodityId,
          entityType: Commodity.entityType,
        });
      }

      const result = commodity.close();

      if (result === 'changed') {
        await this.commodityRepository.close(
          user.getId().valueOf(),
          commodityId,
          {
            updatedAt: commodity.getUpdatedAt().valueOf(),
          },
        );
      }

      return commodity.toSnapshot();
    });

    return CommodityMapper.toResponseDTOFromSnapshot(commoditySnapshot);
  }
}
