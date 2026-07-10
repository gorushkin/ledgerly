import { InvalidNameError } from 'src/domain/domain.errors';

export class Name {
  private readonly value: string;

  private constructor(value: string) {
    this.value = value;
    Object.freeze(this);
  }

  static create(raw: string): Name {
    const trimmed = raw.trim();

    if (trimmed.length === 0) {
      throw new InvalidNameError();
    }

    return new Name(trimmed);
  }

  static restore(value: string): Name {
    return new Name(value);
  }

  /**
   * @deprecated Use restore() for domain snapshot restoration.
   * Remove this compatibility alias in LED-81.
   */
  static fromPersistence(value: string): Name {
    return Name.restore(value);
  }

  /**
   * @deprecated Use equals() for value equality.
   * Remove this compatibility alias in LED-80.
   */
  isEqualTo(other: Name): boolean {
    return this.value === other.value;
  }

  equals(other: Name): boolean {
    return this.value === other.value;
  }

  valueOf(): string {
    return this.value;
  }

  toPersistence(): string {
    return this.value;
  }
}
