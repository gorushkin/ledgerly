import { apiErrorCodes, type UUID } from '@ledgerly/shared/types';
import {
  AccountHasActiveOperationsError,
  AuthenticationFailedError,
  CommodityClosedError,
  CommodityHasActiveReferencesError,
  EntityAlreadyExistsError,
  InvalidPasswordError,
  ApplicationError,
  EntityNotFoundError,
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

  it('uses a stable public code for an entity that already exists', () => {
    expect(
      new EntityAlreadyExistsError({
        entityType: 'user',
        field: 'email',
      }),
    ).toMatchObject({
      code: apiErrorCodes.entityAlreadyExists,
      context: {
        entityType: 'user',
        field: 'email',
      },
    });
  });

  it('uses a stable public code for an account with active operations', () => {
    const accountId = '550e8400-e29b-41d4-a716-446655440001' as UUID;

    expect(new AccountHasActiveOperationsError(accountId)).toMatchObject({
      code: apiErrorCodes.accountHasActiveOperations,
      context: { accountId },
    });
  });

  it('uses a stable public code for a closed commodity reference', () => {
    const commodityId = '550e8400-e29b-41d4-a716-446655440002' as UUID;

    expect(
      new CommodityClosedError(commodityId, 'create_account'),
    ).toMatchObject({
      code: apiErrorCodes.closedCommodityReference,
      context: { commodityId, operation: 'create_account' },
    });
  });

  it('uses a stable public code for a commodity with active references', () => {
    const commodityId = '550e8400-e29b-41d4-a716-446655440002' as UUID;

    expect(new CommodityHasActiveReferencesError(commodityId)).toMatchObject({
      code: apiErrorCodes.commodityHasActiveReferences,
      context: { commodityId },
    });
  });
});
