import { apiErrorCodes } from '@ledgerly/shared/types';
import { InvalidAccountTypeError } from 'src/domain/domain.errors';
import { describe, expect, it } from 'vitest';

import { AccountType } from './account-type.enum';

describe('AccountType', () => {
  it('returns INVALID_ACCOUNT_TYPE for unsupported account types', () => {
    try {
      AccountType.create('unsupported' as never);
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
