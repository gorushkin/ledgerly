import type { TransactionContext } from 'src/application/interfaces';
import type { DataBase, TxType } from 'src/db';
import { describe, expect, it, vi } from 'vitest';

import { TransactionManager } from './TransactionManager';

describe('TransactionManager', () => {
  it('reuses the current transaction context for nested run calls', async () => {
    const tx = { id: 'tx' } as unknown as TxType;
    const transaction = vi.fn((callback: (tx: TxType) => Promise<string>) =>
      callback(tx),
    );
    const db = {
      transaction,
    } as unknown as DataBase;
    const transactionManager = new TransactionManager(db);

    let outerContext: TransactionContext | undefined;

    const result = await transactionManager.run(async (context) => {
      const outerTransaction = transactionManager.getCurrentTransaction();
      outerContext = context;

      return await transactionManager.run((nestedContext) => {
        expect(transactionManager.getCurrentTransaction()).toBe(
          outerTransaction,
        );
        expect(nestedContext).toBe(outerContext);

        return Promise.resolve('nested result');
      });
    });

    expect(result).toBe('nested result');
    expect(outerContext).toEqual({});
    expect(transaction).toHaveBeenCalledTimes(1);
    expect(transactionManager.getCurrentTransaction()).toBe(db);
  });
});
