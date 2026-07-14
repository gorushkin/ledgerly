import { AmountString } from '@ledgerly/shared/types';
import { amountBigint, amountString } from '@ledgerly/shared/validation';
import { InvalidAmountError } from 'src/domain/domain.errors';

import { parseValueObject } from './parseValueObject';

const parseAmount = (value: string): bigint => {
  const minor = parseValueObject(
    value,
    amountBigint,
    (cause, invalidValue) => new InvalidAmountError(invalidValue, cause),
  );

  return minor;
};

/**
 * Signed monetary amount stored as integer minor units without currency.
 */
export class Amount {
  private constructor(private readonly minor: bigint) {
    Object.freeze(this);
  }

  static create(value: string): Amount {
    return new Amount(parseAmount(value));
  }

  static restore(value: string): Amount {
    return new Amount(parseAmount(value));
  }

  equals(other: Amount): boolean {
    return this.minor === other.minor;
  }

  valueOf(): AmountString {
    return amountString.parse(String(this.minor));
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

  toPersistence(): AmountString {
    return amountString.parse(String(this.minor));
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
