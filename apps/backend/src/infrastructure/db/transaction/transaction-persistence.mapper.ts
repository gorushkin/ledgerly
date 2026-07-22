import { TransactionDbInsert } from 'src/db/schema';
import { Transaction } from 'src/domain';

export class TransactionPersistenceMapper {
  static toDBRow(transaction: Transaction): TransactionDbInsert {
    const snapshot = transaction.toSnapshot();

    return {
      commodityId: snapshot.commodityId,
      createdAt: snapshot.createdAt,
      currency: snapshot.currency,
      description: snapshot.description,
      id: snapshot.id,
      isTombstone: snapshot.isTombstone,
      postingDate: snapshot.postingDate,
      transactionDate: snapshot.transactionDate,
      updatedAt: snapshot.updatedAt,
      userId: snapshot.userId,
      version: snapshot.version,
    };
  }
}
