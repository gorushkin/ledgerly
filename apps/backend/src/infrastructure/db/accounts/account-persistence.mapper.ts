import { AccountDbRow, AccountRepoInsert } from 'src/db/schema';
import { Account, AccountSnapshot } from 'src/domain/accounts';

export class AccountPersistenceMapper {
  static toDomain(row: AccountDbRow): Account {
    return Account.restore(AccountPersistenceMapper.toSnapshot(row));
  }

  static toSnapshot(row: AccountDbRow): AccountSnapshot {
    return {
      commodityId: row.commodityId,
      createdAt: row.createdAt,
      description: row.description,
      id: row.id,
      isClosed: row.isClosed,
      isTombstone: row.isTombstone,
      name: row.name,
      type: row.type,
      updatedAt: row.updatedAt,
      userId: row.userId,
    };
  }

  static toDBRowFromSnapshot(snapshot: AccountSnapshot): AccountRepoInsert {
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
}
