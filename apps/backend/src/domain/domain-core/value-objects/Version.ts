import { InvalidVersionError } from 'src/domain/domain.errors';

export class Version {
  private constructor(private readonly value: number) {
    if (!Number.isInteger(value) || value < 0) {
      throw new InvalidVersionError(value);
    }

    Object.freeze(this);
  }

  static create(value: number): Version {
    return new Version(value);
  }

  static restore(value: number): Version {
    return new Version(value);
  }

  toString(): string {
    return this.value.toString();
  }

  equals(other: Version): boolean {
    return this.value === other.value;
  }

  valueOf(): number {
    return this.value;
  }

  increment(): Version {
    return new Version(this.value + 1);
  }
}
