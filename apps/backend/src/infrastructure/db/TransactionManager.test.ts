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

    const result = await transactionManager.run(async () => {
      const outerTransaction = transactionManager.getCurrentTransaction();

      return await transactionManager.run(() => {
        expect(transactionManager.getCurrentTransaction()).toBe(
          outerTransaction,
        );

        return Promise.resolve('nested result');
      });
    });

    expect(result).toBe('nested result');
    expect(transaction).toHaveBeenCalledTimes(1);
    expect(transactionManager.getCurrentTransaction()).toBe(db);
  });
});
