import { apiErrorCodes } from '@ledgerly/shared/types';
import {
  InvalidDateError,
  InvalidIdentifierError,
  InvalidTimestampError,
} from 'src/domain/domain.errors';
import { describe, expect, it } from 'vitest';

import { DateValue } from './DateValue';
import { Id } from './Id';
import { Timestamp } from './Timestamp';

describe('temporal and identifier value objects', () => {
  it('returns INVALID_IDENTIFIER for malformed persistence IDs', () => {
    try {
      Id.fromPersistence('not-a-uuid');
    } catch (error) {
      expect(error).toBeInstanceOf(InvalidIdentifierError);
      expect(error).toMatchObject({
        code: apiErrorCodes.invalidIdentifier,
        context: { reason: 'INVALID_FORMAT' },
      });
      return;
    }

    throw new Error('Expected InvalidIdentifierError to be thrown');
  });

  it('returns INVALID_TIMESTAMP for malformed persistence timestamps', () => {
    expect(() => Timestamp.restore('not-a-timestamp')).toThrow(
      InvalidTimestampError,
    );
  });

  it('returns INVALID_DATE for malformed persistence dates', () => {
    expect(() => DateValue.restore('not-a-date')).toThrow(InvalidDateError);
  });
});
