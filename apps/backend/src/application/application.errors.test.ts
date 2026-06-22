import {
  ApplicationError,
  EntityNotFoundError,
} from 'src/application/application.errors';
import { describe, expect, it } from 'vitest';

describe('coded application errors', () => {
  it('preserves the application layer identity', () => {
    const error = new EntityNotFoundError({ entityType: 'account' });

    expect(error).toBeInstanceOf(ApplicationError);
    expect(error).toMatchObject({
      code: 'ENTITY_NOT_FOUND',
      context: { entityType: 'account' },
    });
  });
});
