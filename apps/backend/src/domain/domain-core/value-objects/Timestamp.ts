import { IsoDatetimeString } from '@ledgerly/shared/types';
import { isoDatetime } from '@ledgerly/shared/validation';

export class Timestamp {
  private readonly _value: IsoDatetimeString;
  private constructor(value: string) {
    const parsed = isoDatetime.parse(value);

    if (!parsed) {
      throw new Error('Invalid UUID format');
    }

    this._value = parsed;
  }

  static create(): Timestamp {
    const now = isoDatetime.parse(new Date().toISOString());
    return new Timestamp(now);
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
