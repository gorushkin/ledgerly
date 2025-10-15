import { IsoDateString } from '@ledgerly/shared/types';
import { isoDate } from '@ledgerly/shared/validation';
import { getTodayDateString } from 'src/libs/date';

export class DateValue {
  private readonly _value: IsoDateString;
  private constructor(value: string) {
    const parsed = isoDate.parse(value);

    if (!parsed) {
      throw new Error('Invalid UUID format');
    }

    this._value = parsed;
  }

  static create(): DateValue {
    const now = isoDate.parse(getTodayDateString());
    return new DateValue(now);
  }

  static restore(value: string): DateValue {
    return new DateValue(value);
  }

  toString(): string {
    return this._value;
  }

  isEqualTo(other: DateValue): boolean {
    return this._value === other._value;
  }

  valueOf(): IsoDateString {
    return this._value;
  }

  toDate(): Date {
    return new Date(this._value);
  }
}
