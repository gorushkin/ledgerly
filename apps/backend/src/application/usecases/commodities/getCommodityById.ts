import { CommodityResponseDTO, UUID } from '@ledgerly/shared/types';
import { CommodityMapper } from 'src/application';
import { CommodityRepositoryInterface } from 'src/application/interfaces';
import { User } from 'src/domain/users/user.entity';

export class GetCommodityByIdUseCase {
  constructor(
    protected readonly commodityRepository: CommodityRepositoryInterface,
  ) {}

  async execute(user: User, commodityId: UUID): Promise<CommodityResponseDTO> {
    const commodity = await this.commodityRepository.getById(
      user.getId().valueOf(),
      commodityId,
    );

    return CommodityMapper.toResponseDTOFromSnapshot(commodity);
  }
}
