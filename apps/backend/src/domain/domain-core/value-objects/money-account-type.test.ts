import { AccountType } from 'src/domain/accounts';
import {
  CurrencyMismatchError,
  InvalidAccountTypeError,
  InvalidMoneyAmountError,
} from 'src/domain/domain.errors';
import { describe, expect, it } from 'vitest';

import { Currency } from './Currency';
import { Money } from './Money';

describe('money and account type value objects', () => {
  it('returns INVALID_MONEY_AMOUNT for an invalid minor-unit value', () => {
    const usdCurrency = Currency.create('USD');

    try {
      Money.create('12.5', usdCurrency.valueOf());
    } catch (error) {
      expect(error).toBeInstanceOf(InvalidMoneyAmountError);
      expect(error).toMatchObject({
        code: 'INVALID_MONEY_AMOUNT',
        context: { reason: 'INVALID_INTEGER_MINOR_UNITS' },
      });
      return;
    }

    throw new Error('Expected InvalidMoneyAmountError to be thrown');
  });

  it('returns CURRENCY_MISMATCH for cross-currency arithmetic', () => {
    const usdCurrency = Currency.create('USD');
    const eurCurrency = Currency.create('EUR');

    const usd = Money.create('100', usdCurrency.valueOf());
    const eur = Money.create('100', eurCurrency.valueOf());

    try {
      usd.add(eur);
    } catch (error) {
      expect(error).toBeInstanceOf(CurrencyMismatchError);
      expect(error).toMatchObject({
        code: 'CURRENCY_MISMATCH',
        context: {
          expectedCurrency: 'USD',
          receivedCurrency: 'EUR',
        },
      });
      return;
    }

    throw new Error('Expected CurrencyMismatchError to be thrown');
  });

  it('returns INVALID_ACCOUNT_TYPE for unsupported account types', () => {
    try {
      AccountType.create('unsupported' as never);
    } catch (error) {
      expect(error).toBeInstanceOf(InvalidAccountTypeError);
      expect(error).toMatchObject({
        code: 'INVALID_ACCOUNT_TYPE',
        context: { receivedType: 'unsupported' },
      });
      return;
    }

    throw new Error('Expected InvalidAccountTypeError to be thrown');
  });
});
