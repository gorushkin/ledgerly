import {
  DatabaseError,
  DatabaseOperationError,
} from 'src/infrastructure/errors';
import { describe, expect, it, vi } from 'vitest';

import { saveWithIdRetry } from './saveWithIdRetry';

describe('saveWithIdRetry', () => {
  it('keeps persistence diagnostics in the cause, not the error message', async () => {
    const diagnostic = new Error('postgres://user:password@database');
    const entity = { toPersistence: () => ({ id: 'entity-id' }) };
    const insert = vi.fn().mockRejectedValue(diagnostic);

    await expect(
      saveWithIdRetry(insert, () => entity, 0),
    ).rejects.toMatchObject({
      cause: diagnostic,
      message: 'Failed to create entity',
    });
    await expect(
      saveWithIdRetry(insert, () => entity, 0),
    ).rejects.toBeInstanceOf(DatabaseError);
    await expect(
      saveWithIdRetry(insert, () => entity, 0),
    ).rejects.toBeInstanceOf(DatabaseOperationError);
  });
});
