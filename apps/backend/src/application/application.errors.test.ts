import { apiErrorCodes } from '@ledgerly/shared/types';
import {
  AuthenticationFailedError,
  InvalidPasswordError,
  ApplicationError,
  EntityNotFoundError,
  UserAlreadyExistsError,
  UserNotFoundError,
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

  it.each([
    ['a missing user', new UserNotFoundError(), 'User not found'],
    ['an invalid password', new InvalidPasswordError(), 'Invalid password'],
  ])(
    'keeps %s diagnostics out of the public auth contract',
    (_caseName, error, message) => {
      expect(error).toBeInstanceOf(AuthenticationFailedError);
      expect(error).toMatchObject({
        code: apiErrorCodes.authenticationFailed,
        context: {},
        message,
      });
    },
  );

  it('uses a stable public code for a registration conflict', () => {
    expect(new UserAlreadyExistsError()).toMatchObject({
      code: apiErrorCodes.registrationConflict,
      context: {},
    });
  });
});
