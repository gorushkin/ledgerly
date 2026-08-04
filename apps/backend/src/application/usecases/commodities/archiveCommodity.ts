import { CommodityResponseDTO, UUID } from '@ledgerly/shared/types';
import { CommodityMapper } from 'src/application';
import { EntityNotFoundError } from 'src/application/application.errors';
import { CommodityRepositoryInterface } from 'src/application/interfaces';
import { EnsureOwnedSnapshotFn } from 'src/application/shared/ensureOwnedSnapshot';
import { Commodity, CommoditySnapshot } from 'src/domain/commodities';
import { User } from 'src/domain/users/user.entity';

export class ArchiveCommodityUseCase {
  constructor(
    protected readonly commodityRepository: CommodityRepositoryInterface,
    protected readonly ensureOwnedSnapshot: EnsureOwnedSnapshotFn,
  ) {}

  async execute(user: User, commodityId: UUID): Promise<CommodityResponseDTO> {
    const commodityData = await this.ensureOwnedSnapshot<CommoditySnapshot>({
      entityId: commodityId,
      entityType: Commodity.entityType,
      getOwnerId: (commodity) => commodity.userId,
      load: this.commodityRepository.getById.bind(this.commodityRepository),
      user,
    });

    if (commodityData.isTombstone) {
      throw new EntityNotFoundError({
        entityId: commodityId,
        entityType: Commodity.entityType,
      });
    }

    const commodity = Commodity.restore(commodityData);

    commodity.delete();

    const updatedCommodity = await this.commodityRepository.softDelete(
      user.getId().valueOf(),
      commodityId,
      { updatedAt: commodity.getUpdatedAt().valueOf() },
    );

    return CommodityMapper.toResponseDTOFromSnapshot(updatedCommodity);
  }
}
