import { IsoDatetimeString } from '@ledgerly/shared/types';
import { isoDatetime } from '@ledgerly/shared/validation';
import { InvalidTimestampError } from 'src/domain/domain.errors';

import { parseValueObject } from './parseValueObject';

export class Timestamp {
  private readonly value: IsoDatetimeString;
  private constructor(value: string) {
    this.value = parseValueObject(
      value,
      isoDatetime,
      (cause) => new InvalidTimestampError(cause),
    );
    Object.freeze(this);
  }

  static create(): Timestamp {
    return new Timestamp(new Date().toISOString());
  }

  static restore(value: string): Timestamp {
    return new Timestamp(value);
  }

  toString(): string {
    return this.value;
  }

  equals(other: Timestamp): boolean {
    return this.value === other.value;
  }

  valueOf(): IsoDatetimeString {
    return this.value;
  }

  toDate(): Date {
    return new Date(this.value);
  }
}
