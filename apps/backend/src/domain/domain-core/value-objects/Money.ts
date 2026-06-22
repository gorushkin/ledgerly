import { CurrencyCode, MoneyString } from '@ledgerly/shared/types';
import {
  moneyAmountBigint,
  moneyAmountString,
} from '@ledgerly/shared/validation';
import {
  CurrencyMismatchError,
  InvalidMoneyAmountError,
} from 'src/domain/domain.errors';

import { parseValueObject } from './parseValueObject';

export class Money {
  private readonly minor: bigint;
  private readonly currency: CurrencyCode;
  constructor(value: string, currency: CurrencyCode) {
    this.minor = parseValueObject(
      value,
      moneyAmountBigint,
      () => new InvalidMoneyAmountError(),
    );
    this.currency = currency;
  }

  static create(value: string, currency: CurrencyCode): Money {
    return new Money(value, currency);
  }

  static fromPersistence(value: string, currency: CurrencyCode): Money {
    return new Money(value, currency);
  }

  equals(other: Money): boolean {
    return this.minor === other.minor && this.currency === other.currency;
  }

  valueOf(): MoneyString {
    return moneyAmountString.parse(String(this.minor));
  }

  private assertSameCurrency(other: Money): void {
    if (this.currency !== other.currency) {
      throw new CurrencyMismatchError(this.currency, other.currency);
    }
  }

  add(other: Money): Money {
    this.assertSameCurrency(other);
    return new Money(String(this.minor + other.minor), this.currency);
  }

  subtract(other: Money): Money {
    this.assertSameCurrency(other);

    return new Money(String(this.minor - other.minor), this.currency);
  }

  getCurrency(): CurrencyCode {
    return this.currency;
  }

  toPersistence(): { amount: MoneyString; currency: CurrencyCode } {
    return {
      amount: moneyAmountString.parse(String(this.minor)),
      currency: this.currency,
    };
  }
}
