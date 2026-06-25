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

  write<T, E extends { toPersistence: () => T }, K>(
    entity: E,
    promise: (data: T) => Promise<K>,
    generateEntity: (prevEntity: E) => E,
    retries = 0,
  ): Promise<K> {
    return this.writeNewEntryToDatabase(
      entity,
      promise,
      generateEntity,
      retries,
    );
  }
}

describe('BaseRepository', () => {
  it('wraps exhausted create failures in a concrete database operation error', async () => {
    const repository = new TestRepository();
    const diagnostic = new Error('database password is secret');
    const entity = { toPersistence: () => ({ id: 'entity-id' }) };

    const result = repository.write(
      entity,
      vi.fn().mockRejectedValue(diagnostic),
      vi.fn(),
    );

    await expect(result).rejects.toMatchObject({
      cause: diagnostic,
      message: 'Failed to create entity',
    });
    await expect(result).rejects.toBeInstanceOf(DatabaseError);
    await expect(result).rejects.toBeInstanceOf(DatabaseOperationError);
  });
});
