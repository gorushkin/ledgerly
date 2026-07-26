import { CommodityResponseDTO } from '@ledgerly/shared/types';
import { CommodityMapper } from 'src/application';
import { CommodityRepositoryInterface } from 'src/application/interfaces';
import { User } from 'src/domain/users/user.entity';

export class GetAllCommoditiesUseCase {
  constructor(
    protected readonly commodityRepository: CommodityRepositoryInterface,
  ) {}

  async execute(user: User): Promise<CommodityResponseDTO[]> {
    const commoditiesSnapshots = await this.commodityRepository.getAll(
      user.getId().valueOf(),
    );

    return commoditiesSnapshots.map((commoditySnapshot) =>
      CommodityMapper.toResponseDTOFromSnapshot(commoditySnapshot),
    );
  }
}
