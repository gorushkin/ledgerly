import { apiErrorCodes } from '@ledgerly/shared/types';
import { InvalidAccountTypeError } from 'src/domain/domain.errors';
import { describe, expect, it } from 'vitest';

import { AccountType } from './account-type.enum';

describe('AccountType', () => {
  it('returns INVALID_ACCOUNT_TYPE for unsupported account types', () => {
    const unsupportedType = 'unsupported' as unknown as Parameters<
      typeof AccountType.create
    >[0];

    try {
      AccountType.create(unsupportedType);
    } catch (error) {
      expect(error).toBeInstanceOf(InvalidAccountTypeError);
      expect(error).toMatchObject({
        code: apiErrorCodes.invalidAccountType,
        context: { receivedType: 'unsupported' },
      });
      return;
    }

    throw new Error('Expected InvalidAccountTypeError to be thrown');
  });
});
