import {
  CommodityResponseDTO,
  UUID,
  CommodityUpdateDTO,
} from '@ledgerly/shared/types';
import { CommodityMapper } from 'src/application';
import { EntityNotFoundError } from 'src/application/application.errors';
import {
  CommodityRepositoryInterface,
  TransactionManagerInterface,
} from 'src/application/interfaces';
import { EnsureOwnedSnapshotFn } from 'src/application/shared/ensureOwnedSnapshot';
import { Commodity, CommoditySnapshot } from 'src/domain/commodities';
import { User } from 'src/domain/users/user.entity';

export class UpdateCommodityUseCase {
  constructor(
    protected readonly commodityRepository: CommodityRepositoryInterface,
    protected readonly ensureOwnedSnapshot: EnsureOwnedSnapshotFn,
    private readonly transactionManager: TransactionManagerInterface,
  ) {}

  async execute(
    user: User,
    commodityId: UUID,
    data: CommodityUpdateDTO,
  ): Promise<CommodityResponseDTO> {
    const updatedCommoditySnapshot = await this.transactionManager.run(
      async () => {
        const commodityData = await this.ensureOwnedSnapshot<CommoditySnapshot>(
          {
            entityId: commodityId,
            entityType: Commodity.entityType,
            getOwnerId: (commodity) => commodity.userId,
            load: this.commodityRepository.getById.bind(
              this.commodityRepository,
            ),
            user,
          },
        );

        const commodity = Commodity.restore(commodityData);

        if (commodity.isDeleted()) {
          throw new EntityNotFoundError({
            entityId: commodityId,
            entityType: Commodity.entityType,
          });
        }

        commodity.update(CommodityMapper.toUpdateProps(data));

        const updatedCommoditySnapshot = commodity.toSnapshot();

        await this.commodityRepository.update(
          user.getId().valueOf(),
          commodityId,
          updatedCommoditySnapshot,
        );

        return updatedCommoditySnapshot;
      },
    );

    return CommodityMapper.toResponseDTOFromSnapshot(updatedCommoditySnapshot);
  }
}
