import { MoneyString } from '@ledgerly/shared/types';
import {
  moneyAmountBigint,
  moneyAmountString,
} from '@ledgerly/shared/validation';

export class Amount {
  private readonly minor: bigint;
  private constructor(value: string | bigint) {
    if (typeof value === 'bigint') {
      this.minor = value;
      return;
    }

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
    return new Amount(this.minor + other.minor);
  }

  subtract(other: Amount): Amount {
    return new Amount(this.minor - other.minor);
  }

  negate(): Amount {
    return new Amount(-this.minor);
  }

  toPersistence(): MoneyString {
    return moneyAmountString.parse(String(this.minor));
  }

  isZero(): boolean {
    return this.minor === BigInt(0);
  }

  isPositive(): boolean {
    return this.minor > BigInt(0);
  }

  isNegative(): boolean {
    return this.minor < BigInt(0);
  }
}
