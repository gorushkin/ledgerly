import { CurrencyCode, MoneyString } from '@ledgerly/shared/types';
import {
  moneyAmountBigint,
  moneyAmountString,
} from '@ledgerly/shared/validation';

export class Money {
  private readonly minor: bigint;
  private readonly currency: CurrencyCode;
  constructor(value: string, currency: CurrencyCode) {
    const parsed = moneyAmountBigint.parse(value);

    if (typeof parsed !== 'bigint') {
      throw new Error('Invalid money amount');
    }

    this.minor = parsed;
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
      throw new Error('Currency mismatch');
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
