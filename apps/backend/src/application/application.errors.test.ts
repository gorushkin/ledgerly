import { apiErrorCodes } from '@ledgerly/shared/types';
import {
  AuthenticationFailedError,
  ApplicationError,
  EntityNotFoundError,
  UserAlreadyExistsError,
} from 'src/application/application.errors';
import { describe, expect, it } from 'vitest';

describe('coded application errors', () => {
  it('preserves the application layer identity', () => {
    const error = new EntityNotFoundError({ entityType: 'account' });

    expect(error).toBeInstanceOf(ApplicationError);
    expect(error).toMatchObject({
      code: apiErrorCodes.entityNotFound,
      context: { entityType: 'account' },
    });
  });

  it('keeps auth diagnostics out of the public contract', () => {
    expect(new AuthenticationFailedError('missing user')).toMatchObject({
      code: apiErrorCodes.authenticationFailed,
      context: {},
      message: 'missing user',
    });
  });

  it('uses a stable public code for a registration conflict', () => {
    expect(new UserAlreadyExistsError()).toMatchObject({
      code: apiErrorCodes.registrationConflict,
      context: {},
    });
  });
});
