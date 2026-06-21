import { IsoDateString } from '@ledgerly/shared/types';
import { isoDate } from '@ledgerly/shared/validation';
import { InvalidDateError } from 'src/domain/domain.errors';
import { getTodayDateString } from 'src/libs/date';

import { parseValueObject } from './parseValueObject';

export class DateValue {
  private readonly _value: IsoDateString;
  private constructor(value: string) {
    this._value = parseValueObject(
      value,
      isoDate,
      () => new InvalidDateError(),
    );
  }

  static create(): DateValue {
    return new DateValue(getTodayDateString());
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
