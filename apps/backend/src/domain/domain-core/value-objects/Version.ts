import { InvalidVersionError } from 'src/domain/domain.errors';

export class Version {
  private readonly _value: number;

  private constructor(value: number) {
    if (!Number.isInteger(value) || value < 0) {
      throw new InvalidVersionError(value);
    }

    this._value = value;
    Object.freeze(this);
  }

  static create(value: number): Version {
    return new Version(value);
  }

  static restore(value: number): Version {
    return new Version(value);
  }

  toString(): string {
    return this._value.toString();
  }

  isEqualTo(other: Version): boolean {
    return this._value === other._value;
  }

  valueOf(): number {
    return this._value;
  }

  increment(): Version {
    return new Version(this._value + 1);
  }
}
