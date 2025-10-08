import { MoneyString } from '@ledgerly/shared/types';
import {
  moneyAmountBigint,
  moneyAmountString,
} from '@ledgerly/shared/validation';

export class Amount {
  private readonly minor: bigint;
  constructor(value: string) {
    const parsed = moneyAmountBigint.parse(value);

    if (typeof parsed !== 'bigint') {
      throw new Error('Invalid money amount');
    }

    this.minor = parsed;
  }

  static create(value: string): Amount {
    return new Amount(value);
  }

  static fromPersistence(value: string): Amount {
    return new Amount(value);
  }

  equals(other: Amount): boolean {
    return this.minor === other.minor;
  }

  valueOf(): MoneyString {
    return moneyAmountString.parse(String(this.minor));
  }

  add(other: Amount): Amount {
    return new Amount(String(this.minor + other.minor));
  }

  subtract(other: Amount): Amount {
    return new Amount(String(this.minor - other.minor));
  }

  toPersistence(): MoneyString {
    return moneyAmountString.parse(String(this.minor));
  }
}
