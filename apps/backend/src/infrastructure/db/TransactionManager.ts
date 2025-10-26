import {
  TransactionContext,
  TransactionManagerInterface,
} from 'src/application/interfaces';
import { DataBase, TxType } from 'src/db';

export class TransactionManager implements TransactionManagerInterface {
  private currentTransaction: TxType | null = null;

  constructor(private readonly db: DataBase) {}

  async run<T>(
    callback: (context: TransactionContext) => Promise<T>,
  ): Promise<T> {
    return await this.db.transaction(async (tx: TxType) => {
      this.currentTransaction = tx;
      try {
        const context: TransactionContext = {};
        return await callback(context);
      } catch (error) {
        console.error('Transaction error, rolling back:', error);
        // TODO: log error to monitoring service
        throw error;
      } finally {
        this.currentTransaction = null;
      }
    });
  }

  getCurrentTransaction(): TxType | DataBase {
    return this.currentTransaction ?? this.db;
  }
}
