import { IsoDatetimeString } from '@ledgerly/shared/types';
import { isoDatetime } from '@ledgerly/shared/validation';
import { InvalidTimestampError } from 'src/domain/domain.errors';

import { parseValueObject } from './parseValueObject';

export class Timestamp {
  private readonly _value: IsoDatetimeString;
  private constructor(value: string) {
    this._value = parseValueObject(
      value,
      isoDatetime,
      () => new InvalidTimestampError(),
    );
  }

  static create(): Timestamp {
    return new Timestamp(new Date().toISOString());
  }

  static restore(value: string): Timestamp {
    return new Timestamp(value);
  }

  toString(): string {
    return this._value;
  }

  isEqualTo(other: Timestamp): boolean {
    return this._value === other._value;
  }

  valueOf(): IsoDatetimeString {
    return this._value;
  }

  toDate(): Date {
    return new Date(this._value);
  }
}
