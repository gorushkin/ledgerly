import {
  InvalidNameError,
  InvalidPasswordError,
} from 'src/domain/domain.errors';
import { describe, expect, it } from 'vitest';

import { Name } from './Name';
import { Password } from './Password';

describe('text and credential value objects', () => {
  it('returns INVALID_NAME for an empty name', () => {
    try {
      Name.create('  ');
    } catch (error) {
      expect(error).toBeInstanceOf(InvalidNameError);
      expect(error).toMatchObject({
        code: 'INVALID_NAME',
        context: { reason: 'EMPTY' },
      });
      return;
    }

    throw new Error('Expected InvalidNameError to be thrown');
  });

  it('returns INVALID_PASSWORD without exposing the password', async () => {
    try {
      await Password.create('short');
    } catch (error) {
      expect(error).toBeInstanceOf(InvalidPasswordError);
      expect(error).toMatchObject({
        code: 'INVALID_PASSWORD',
        context: { reason: 'POLICY_VIOLATION' },
      });
      return;
    }

    throw new Error('Expected InvalidPasswordError to be thrown');
  });
});
