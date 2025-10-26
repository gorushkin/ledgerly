import { AsyncLocalStorage } from 'node:async_hooks';

import {
  TransactionContext,
  TransactionManagerInterface,
} from 'src/application/interfaces';
import { DataBase, TxType } from 'src/db';

type Store = {
  tx: TxType;
};

export class TransactionManager implements TransactionManagerInterface {
  private storage = new AsyncLocalStorage<Store>();
  constructor(private readonly db: DataBase) {}

  async run<T>(
    callback: (context?: TransactionContext) => Promise<T>,
  ): Promise<T> {
    return await this.db.transaction(async (tx: TxType) => {
      const existingStore = this.storage.getStore();
      if (existingStore) {
        return await callback();
      }

      return this.storage.run({ tx }, async () => {
        try {
          return await callback({});
        } catch (error) {
          console.error('Transaction error, rolling back');
          throw error;
        }
      });
    });
  }

  getCurrentTransaction(): TxType | DataBase {
    const store = this.storage.getStore();
    return store?.tx ?? this.db;
  }
}
