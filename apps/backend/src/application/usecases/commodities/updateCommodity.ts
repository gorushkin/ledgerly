import {
  CommodityResponseDTO,
  UUID,
  CommodityUpdateDTO,
} from '@ledgerly/shared/types';
import { CommodityMapper } from 'src/application';
import { EntityNotFoundError } from 'src/application/application.errors';
import { CommodityRepositoryInterface } from 'src/application/interfaces';
import { EnsureOwnedSnapshotFn } from 'src/application/shared/ensureOwnedSnapshot';
import { Commodity, CommoditySnapshot } from 'src/domain/commodities';
import { User } from 'src/domain/users/user.entity';

export class UpdateCommodityUseCase {
  constructor(
    protected readonly commodityRepository: CommodityRepositoryInterface,
    protected readonly ensureOwnedSnapshot: EnsureOwnedSnapshotFn,
  ) {}

  async execute(
    user: User,
    commodityId: UUID,
    data: CommodityUpdateDTO,
  ): Promise<CommodityResponseDTO> {
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

    commodity.update(CommodityMapper.toUpdateProps(data));

    const updatedCommodity = await this.commodityRepository.update(
      user.getId().valueOf(),
      commodityId,
      commodity.toSnapshot(),
    );

    return CommodityMapper.toResponseDTOFromSnapshot(updatedCommodity);
  }
}
