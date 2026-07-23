import { AccountResponseDTO, AccountUpdateDTO } from '@ledgerly/shared/types';
import { AccountSnapshot, AccountUpdateProps } from 'src/domain/accounts';

export class AccountMapper {
  static toResponseDTOFromSnapshot(
    snapshot: AccountSnapshot,
  ): AccountResponseDTO {
    return {
      commodityId: snapshot.commodityId,
      createdAt: snapshot.createdAt,
      currentClearedBalanceLocal: snapshot.currentClearedBalanceLocal,
      description: snapshot.description,
      id: snapshot.id,
      initialBalance: snapshot.initialBalance,
      isSystem: snapshot.isSystem,
      isTombstone: snapshot.isTombstone,
      name: snapshot.name,
      type: snapshot.type,
      updatedAt: snapshot.updatedAt,
      userId: snapshot.userId,
    };
  }

  static toUpdateProps(dto: AccountUpdateDTO): AccountUpdateProps {
    return {
      description: dto.description,
      name: dto.name,
      type: dto.type,
    };
  }
}
