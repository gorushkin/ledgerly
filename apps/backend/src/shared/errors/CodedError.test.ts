import { apiErrorCodes } from '@ledgerly/shared/types';
import {
  CodedInfrastructureError,
  InfrastructureError,
} from 'src/infrastructure/infrastructure.errors';
import { describe, expect, it } from 'vitest';

import { isCodedError } from './CodedError';

class TestCodedInfrastructureError extends CodedInfrastructureError<'ENTITY_NOT_FOUND'> {
  constructor() {
    super('test infrastructure error', apiErrorCodes.entityNotFound, {
      entityType: 'test',
    });
  }
}

describe('coded error contract', () => {
  it('recognizes coded infrastructure errors and preserves layer identity', () => {
    const error = new TestCodedInfrastructureError();

    expect(error).toBeInstanceOf(InfrastructureError);
    expect(isCodedError(error)).toBe(true);
  });

  it('rejects ordinary and malformed errors', () => {
    expect(isCodedError(new Error('ordinary error'))).toBe(false);
    expect(isCodedError({ code: 'UNKNOWN', context: {} })).toBe(false);
    expect(isCodedError({ code: apiErrorCodes.entityNotFound })).toBe(false);
    expect(
      isCodedError({ code: apiErrorCodes.entityNotFound, context: null }),
    ).toBe(false);
  });
});
