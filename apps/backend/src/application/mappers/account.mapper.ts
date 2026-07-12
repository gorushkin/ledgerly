import { AccountResponseDTO, AccountUpdateDTO } from '@ledgerly/shared/types';
import { AccountDbRow, AccountRepoInsert } from 'src/db/schema';
import {
  Account,
  AccountSnapshot,
  AccountUpdateProps,
} from 'src/domain/accounts';

export class AccountMapper {
  static toDomain(row: AccountDbRow): Account {
    return Account.restore(AccountMapper.toSnapshot(row));
  }

  static toSnapshot(row: AccountDbRow): AccountSnapshot {
    return {
      createdAt: row.createdAt,
      currency: row.currency,
      currentClearedBalanceLocal: row.currentClearedBalanceLocal,
      description: row.description,
      id: row.id,
      initialBalance: row.initialBalance,
      isSystem: row.isSystem,
      isTombstone: row.isTombstone,
      name: row.name,
      type: row.type,
      updatedAt: row.updatedAt,
      userId: row.userId,
    };
  }

  static toDBRowFromSnapshot(snapshot: AccountSnapshot): AccountRepoInsert {
    return {
      createdAt: snapshot.createdAt,
      currency: snapshot.currency,
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

  static toResponseDTOFromSnapshot(
    snapshot: AccountSnapshot,
  ): AccountResponseDTO {
    return {
      createdAt: snapshot.createdAt,
      currency: snapshot.currency,
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
      currency: dto.currency,
      description: dto.description,
      name: dto.name,
      type: dto.type,
    };
  }
}
