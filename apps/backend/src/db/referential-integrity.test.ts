import { BaseRepository, TransactionManager } from 'src/infrastructure/db';
import {
  DBErrorContext,
  ForeignKeyConstraintError,
} from 'src/infrastructure/errors';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { TestDB } from './test-db';

class TestDbOperationExecutor extends BaseRepository {
  run<T>(operation: () => Promise<T>, context: DBErrorContext): Promise<T> {
    return this.executeDatabaseOperation(
      operation,
      'Database referential integrity check',
      context,
    );
  }
}

describe('Database referential integrity', () => {
  let testDB: TestDB;
  let executor: TestDbOperationExecutor;

  beforeEach(async () => {
    testDB = new TestDB();
    await testDB.setupTestDb();

    executor = new TestDbOperationExecutor({
      getCurrentTransaction: () => testDB.db,
      run: async (callback) => callback(),
    } as TransactionManager);
  });

  afterEach(async () => {
    await testDB.cleanupTestDb();
  });

  it('rejects transaction row insert when commodity belongs to another user', async () => {
    const user = await testDB.createUser({
      email: 'user@example.com',
      name: 'User',
    });
    const otherUser = await testDB.createUser({
      email: 'other-user@example.com',
      name: 'Other User',
    });
    const otherUserCommodity = await testDB.createCommodity(otherUser.id);

    await expect(
      executor.run(
        () => testDB.createTransaction(user.id, otherUserCommodity.id),
        {
          field: 'commodityId',
          tableName: 'transactions',
          value: otherUserCommodity.id,
        },
      ),
    ).rejects.toThrow(ForeignKeyConstraintError);
  });
});
