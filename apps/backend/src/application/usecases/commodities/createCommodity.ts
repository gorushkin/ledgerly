import {
  CommodityCreateDTO,
  CommodityResponseDTO,
} from '@ledgerly/shared/types';
import { CommodityRepositoryInterface } from 'src/application/interfaces';
import { CommodityMapper } from 'src/application/mappers/commodity.mapper';
import { mapRepositoryAlreadyExists } from 'src/application/shared/repositoryConflictMapper';
import { Commodity } from 'src/domain/commodities';
import { User } from 'src/domain/users/user.entity';

export class CreateCommodityUseCase {
  constructor(
    protected readonly commodityRepository: CommodityRepositoryInterface,
  ) {}
  async execute(
    user: User,
    data: CommodityCreateDTO,
  ): Promise<CommodityResponseDTO> {
    const commodity = Commodity.create(
      user,
      CommodityMapper.toCreateCommodityProps(data),
    );

    const commoditySnapshot = commodity.toSnapshot();

    await mapRepositoryAlreadyExists(
      () =>
        this.commodityRepository.create(
          user.getId().valueOf(),
          commoditySnapshot,
        ),
      [
        {
          entityType: 'commodity',
          field: 'code',
          tableName: 'commodities',
        },
      ],
    );

    return CommodityMapper.toResponseDTOFromSnapshot(commoditySnapshot);
  }
}
