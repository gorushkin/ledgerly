import { IsoDateString } from '@ledgerly/shared/types';
import { isoDate } from '@ledgerly/shared/validation';
import { InvalidDateError } from 'src/domain/domain.errors';
import { getTodayDateString } from 'src/libs/date';

import { parseValueObject } from './parseValueObject';

export class DateValue {
  private readonly value: IsoDateString;
  private constructor(value: string) {
    this.value = parseValueObject(
      value,
      isoDate,
      (cause) => new InvalidDateError(cause),
    );
    Object.freeze(this);
  }

  static create(): DateValue {
    return new DateValue(getTodayDateString());
  }

  static restore(value: string): DateValue {
    return new DateValue(value);
  }

  toString(): string {
    return this.value;
  }

  /**
   * @deprecated Use equals() for value equality.
   * Remove this compatibility alias in LED-80.
   */
  isEqualTo(other: DateValue): boolean {
    return this.value === other.value;
  }

  equals(other: DateValue): boolean {
    return this.value === other.value;
  }

  valueOf(): IsoDateString {
    return this.value;
  }

  toDate(): Date {
    return new Date(this.value);
  }
}
