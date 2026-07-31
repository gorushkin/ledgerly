import {
  AccountCreateDTO,
  AccountResponseDTO,
  AccountUpdateDTO,
} from '@ledgerly/shared/types';
import {
  AccountSnapshot,
  AccountType,
  AccountUpdateProps,
  CreateAccountProps,
} from 'src/domain/accounts';
import { Amount, Id, Name } from 'src/domain/domain-core';

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
      isClosed: snapshot.isClosed,
      isSystem: snapshot.isSystem,
      isTombstone: snapshot.isTombstone,
      name: snapshot.name,
      type: snapshot.type,
      updatedAt: snapshot.updatedAt,
      userId: snapshot.userId,
    };
  }
  static toCreateAccountProps(dto: AccountCreateDTO): CreateAccountProps {
    return {
      commodityId: Id.restore(dto.commodityId),
      description: dto.description,
      initialBalance: Amount.create(dto.initialBalance),
      name: Name.create(dto.name),
      type: AccountType.create(dto.type),
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
