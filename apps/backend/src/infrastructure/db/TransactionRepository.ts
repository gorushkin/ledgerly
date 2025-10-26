import { TransactionRepositoryInterface } from 'src/application';
import { DataBase } from 'src/db';
import { TransactionDbRow, TransactionRepoInsert } from 'src/db/schema';
import { transactionsTable } from 'src/db/schemas';

import { BaseRepository } from './BaseRepository';
import { TransactionManager } from './TransactionManager';

export class TransactionRepository
  extends BaseRepository
  implements TransactionRepositoryInterface
{
  constructor(db: DataBase, transactionManager: TransactionManager) {
    super(db, transactionManager);
  }

  async create(dto: TransactionRepoInsert): Promise<TransactionDbRow> {
    return this.executeDatabaseOperation(async () => {
      const dbClient = this.getDbClient();

      return await dbClient
        .insert(transactionsTable)
        .values({
          ...dto,
          ...this.createTimestamps,
          ...this.uuid,
          userId: dto.userId,
        })
        .returning()
        .get();
    }, 'Failed to create transaction');
  }

  // private async updateStatus(
  //   userId: UUID,
  //   id: UUID,
  //   isTombstone: boolean,
  //   tx?: TxType,
  // ): Promise<boolean> {
  //   const errorMessages: Record<'true' | 'false', string> = {
  //     false: 'Failed to delete transaction',
  //     true: 'Failed to restore transaction',
  //   };

  //   return this.executeDatabaseOperation(
  //     async () => {
  //       const dbClient = tx ?? this.db;

  //       const res = await dbClient
  //         .update(transactionsTable)
  //         .set({ isTombstone, ...this.updateTimestamp })
  //         .where(
  //           and(
  //             eq(transactionsTable.id, id),
  //             eq(transactionsTable.userId, userId),
  //             eq(transactionsTable.isTombstone, !isTombstone),
  //           ),
  //         )
  //         .run();

  //       return res.rowsAffected > 0;
  //     },
  //     errorMessages[isTombstone.toString() as 'true' | 'false'],
  //   );
  // }

  // async delete(userId: UUID, id: UUID, tx?: TxType): Promise<boolean> {
  //   return this.updateStatus(userId, id, true, tx);
  // }

  // async restore(userId: UUID, id: UUID, tx?: TxType): Promise<boolean> {
  //   return this.updateStatus(userId, id, false, tx);
  // }

  // async update(
  //   userId: UUID,
  //   id: UUID,
  //   data: TransactionDbUpdate,
  //   tx?: TxType,
  // ): Promise<TransactionDbRow> {
  //   return this.executeDatabaseOperation(async () => {
  //     const dbClient = tx ?? this.db;

  //     const updatedTransaction = await dbClient
  //       .update(transactionsTable)
  //       .set({
  //         ...this.updateTimestamp,
  //         description: data.description,
  //         postingDate: data.postingDate,
  //         transactionDate: data.transactionDate,
  //       })
  //       .where(
  //         and(
  //           eq(transactionsTable.id, id),
  //           eq(transactionsTable.userId, userId),
  //         ),
  //       )
  //       .returning()
  //       .get();

  //     if (!updatedTransaction) {
  //       throw new NotFoundError(`Transaction with ID ${id} not found`);
  //     }

  //     return updatedTransaction;
  //   }, 'Failed to update transaction');
  // }
}
