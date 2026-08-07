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
import { Id, Name } from 'src/domain/domain-core';

export class AccountMapper {
  static toResponseDTOFromSnapshot(
    snapshot: AccountSnapshot,
  ): AccountResponseDTO {
    return {
      commodityId: snapshot.commodityId,
      createdAt: snapshot.createdAt,
      description: snapshot.description,
      id: snapshot.id,
      isClosed: snapshot.isClosed,
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
