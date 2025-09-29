import { IsoDatetimeString as IsoDatetimeStringType } from '@ledgerly/shared/types';
import { isoDatetime } from '@ledgerly/shared/validation';

export class IsoDatetimeString {
  private readonly _value: IsoDatetimeStringType;
  private constructor(value: string) {
    const parsed = isoDatetime.parse(value);

    if (!parsed) {
      throw new Error('Invalid UUID format');
    }

    this._value = parsed;
  }

  static create(): IsoDatetimeString {
    const now = isoDatetime.parse(new Date().toISOString());
    return new IsoDatetimeString(now);
  }

  static restore(value: string): IsoDatetimeString {
    return new IsoDatetimeString(value);
  }

  toString(): string {
    return this._value;
  }

  equals(other: IsoDatetimeString): boolean {
    return this._value === other._value;
  }

  valueOf(): IsoDatetimeStringType {
    return this._value;
  }
}
