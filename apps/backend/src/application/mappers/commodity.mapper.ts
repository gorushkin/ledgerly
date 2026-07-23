import {
  CommodityCreateDTO,
  CommodityResponseDTO,
} from '@ledgerly/shared/types';
import {
  CommoditySnapshot,
  CreateCommodityProps,
} from 'src/domain/commodities';

export class CommodityMapper {
  static toResponseDTOFromSnapshot(
    snapshot: CommoditySnapshot,
  ): CommodityResponseDTO {
    return {
      code: snapshot.code,
      createdAt: snapshot.createdAt,
      id: snapshot.id,
      isTombstone: snapshot.isTombstone,
      name: snapshot.name,
      precision: snapshot.precision,
      symbol: snapshot.symbol,
      updatedAt: snapshot.updatedAt,
      userId: snapshot.userId,
    };
  }

  static toCreateCommodityProps(
    props: CommodityCreateDTO,
  ): CreateCommodityProps {
    return {
      code: props.code,
      name: props.name,
      precision: props.precision,
      symbol: props.symbol,
    };
  }
}
