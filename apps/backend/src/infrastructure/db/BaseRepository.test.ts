import {
  DatabaseError,
  DatabaseOperationError,
} from 'src/infrastructure/errors';
import { describe, expect, it, vi } from 'vitest';

import { BaseRepository } from './BaseRepository';
import { TransactionManager } from './TransactionManager';

class TestRepository extends BaseRepository {
  constructor() {
    super({
      getCurrentTransaction: vi.fn(),
    } as unknown as TransactionManager);
  }

  run<T, K>(promise: (entity: T) => Promise<K>): Promise<K> {
    return this.executeDatabaseOperation(
      () => promise({} as T),
      'Failed to create entity',
    );
  }
}

describe('BaseRepository', () => {
  it('wraps exhausted create failures in a concrete database operation error', async () => {
    const repository = new TestRepository();
    const diagnostic = new Error('database password is secret');

    const operation = vi.fn().mockRejectedValue(diagnostic);

    const result = repository.run(operation);

    await expect(result).rejects.toMatchObject({
      cause: diagnostic,
      message: 'Failed to create entity',
    });

    await expect(result).rejects.toBeInstanceOf(DatabaseError);
    await expect(result).rejects.toBeInstanceOf(DatabaseOperationError);
  });
});
