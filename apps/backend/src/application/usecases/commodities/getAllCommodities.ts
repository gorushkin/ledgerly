import { CommodityResponseDTO } from '@ledgerly/shared/types';
import { CommodityQuery } from '@ledgerly/shared/validation';
import { CommodityMapper } from 'src/application';
import { CommodityRepositoryInterface } from 'src/application/interfaces';
import { User } from 'src/domain/users/user.entity';

export class GetAllCommoditiesUseCase {
  constructor(
    protected readonly commodityRepository: CommodityRepositoryInterface,
  ) {}

  async execute(
    user: User,
    status: CommodityQuery,
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
