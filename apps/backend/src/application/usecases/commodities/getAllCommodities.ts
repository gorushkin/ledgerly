import { CommodityResponseDTO, QueryStatus } from '@ledgerly/shared/types';
import { CommodityMapper } from 'src/application';
import { CommodityRepositoryInterface } from 'src/application/interfaces';
import { User } from 'src/domain/users/user.entity';

export class GetAllCommoditiesUseCase {
  constructor(
    protected readonly commodityRepository: CommodityRepositoryInterface,
  ) {}

  async execute(
    user: User,
    status: QueryStatus,
  ): Promise<CommodityResponseDTO[]> {
    const commoditiesSnapshots = await this.commodityRepository.getAll(
      user.getId().valueOf(),
      status,
    );

    return commoditiesSnapshots.map((commoditySnapshot) =>
      CommodityMapper.toResponseDTOFromSnapshot(commoditySnapshot),
    );
  }
}
