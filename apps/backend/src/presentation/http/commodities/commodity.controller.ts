import { CommodityResponseDTO } from '@ledgerly/shared/types';
import {
  commodityCreateSchema,
  commodityUpdateSchema,
  uniqueIdSchema,
  commodityQuerySchema,
} from '@ledgerly/shared/validation';
import {
  GetCommodityByIdUseCase,
  DeleteCommodityUseCase,
  CreateCommodityUseCase,
  GetAllCommoditiesUseCase,
  UpdateCommodityUseCase,
} from 'src/application/usecases/commodities';
import { User } from 'src/domain/users/user.entity';

export class CommodityController {
  constructor(
    private readonly getCommodityByIdUseCase: GetCommodityByIdUseCase,
    private readonly getAllCommoditiesUseCase: GetAllCommoditiesUseCase,
    private readonly createCommodityUseCase: CreateCommodityUseCase,
    private readonly updateCommodityUseCase: UpdateCommodityUseCase,
    private readonly deleteCommodityUseCase: DeleteCommodityUseCase,
  ) {}

  async getAll(
    user: User,
    queryParams: unknown,
  ): Promise<CommodityResponseDTO[]> {
    const parsedQuery = commodityQuerySchema.parse(queryParams);

    return this.getAllCommoditiesUseCase.execute(user, parsedQuery);
  }

  async getById(
    user: User,
    requestParams: unknown,
  ): Promise<CommodityResponseDTO> {
    const { id } = uniqueIdSchema.parse(requestParams);

    return this.getCommodityByIdUseCase.execute(user, id);
  }

  async create(
    user: User,
    requestBody: unknown,
  ): Promise<CommodityResponseDTO> {
    const commodityCreateDto = commodityCreateSchema.parse(requestBody);

    return this.createCommodityUseCase.execute(user, commodityCreateDto);
  }

  async update(
    user: User,
    requestParams: unknown,
    requestBody: unknown,
  ): Promise<CommodityResponseDTO> {
    const { id } = uniqueIdSchema.parse(requestParams);
    const commodityUpdateDto = commodityUpdateSchema.parse(requestBody);

    return this.updateCommodityUseCase.execute(user, id, commodityUpdateDto);
  }

  async delete(user: User, requestParams: unknown): Promise<void> {
    const { id } = uniqueIdSchema.parse(requestParams);

    await this.deleteCommodityUseCase.execute(user, id);
  }
}
