import type { ValidationFieldErrorCode } from '@ledgerly/shared/types';
import { describe, expect, it } from 'vitest';
import { z } from 'zod';

import { getValidationFieldErrorCode } from './errorHandler';

describe('getValidationFieldErrorCode', () => {
  const expectValidationCode = (
    result: ReturnType<z.ZodTypeAny['safeParse']>,
    expectedCode: ValidationFieldErrorCode,
  ) => {
    if (result.success) {
      throw new Error('Expected validation to fail');
    }

    expect(getValidationFieldErrorCode(result.error.issues[0])).toBe(
      expectedCode,
    );
  };

  it('maps a missing required value to REQUIRED', () => {
    expectValidationCode(z.string().safeParse(undefined), 'REQUIRED');
  });

  it('maps an invalid type to INVALID_TYPE', () => {
    expectValidationCode(z.string().safeParse(42), 'INVALID_TYPE');
  });

  it('maps an invalid string format to INVALID_FORMAT', () => {
    expectValidationCode(
      z.string().email().safeParse('invalid'),
      'INVALID_FORMAT',
    );
  });

  it('maps a small value to TOO_SMALL', () => {
    expectValidationCode(z.string().min(2).safeParse('x'), 'TOO_SMALL');
  });

  it('maps a large value to TOO_BIG', () => {
    expectValidationCode(z.string().max(1).safeParse('xx'), 'TOO_BIG');
  });

  it('maps unrecognized Zod issues to INVALID_VALUE', () => {
    expectValidationCode(
      z.literal('expected').safeParse('received'),
      'INVALID_VALUE',
    );
  });
});
