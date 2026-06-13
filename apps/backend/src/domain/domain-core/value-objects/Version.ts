export class Version {
  private readonly _value: number;

  private constructor(value: number) {
    this._value = Number(value);
  }

  static create(value: number): Version {
    if (value === undefined || value === null || isNaN(value) || value < 0) {
      throw new Error('Version must be a non-negative number');
    }
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
