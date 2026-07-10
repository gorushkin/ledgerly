import { apiErrorCodes } from '@ledgerly/shared/types';
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
        code: apiErrorCodes.invalidMoneyAmount,
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
        code: apiErrorCodes.currencyMismatch,
        context: {
          expectedCurrency: 'USD',
          receivedCurrency: 'EUR',
        },
      });
      return;
    }

    throw new Error('Expected CurrencyMismatchError to be thrown');
  });

  it('performs money arithmetic without mutating the source values', () => {
    const usdCurrency = Currency.create('USD');
    const first = Money.create('100', usdCurrency.valueOf());
    const second = Money.create('50', usdCurrency.valueOf());

    const sum = first.add(second);
    const difference = first.subtract(second);

    expect(sum.valueOf()).toBe('150');
    expect(difference.valueOf()).toBe('50');
    expect(first.valueOf()).toBe('100');
    expect(second.valueOf()).toBe('50');
    expect(Object.isFrozen(sum)).toBe(true);
    expect(Object.isFrozen(difference)).toBe(true);
  });

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
