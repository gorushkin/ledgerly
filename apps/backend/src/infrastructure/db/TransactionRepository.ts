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
}
