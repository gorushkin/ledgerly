export class Name {
  private readonly value: string;

  private constructor(value: string) {
    this.value = value;
    Object.freeze(this);
  }

  static create(raw: string): Name {
    const trimmed = raw.trim();

    if (trimmed.length === 0) {
      throw new Error('Invalid name');
    }

    return new Name(trimmed);
  }

  static fromPersistence(value: string): Name {
    return new Name(value);
  }

  isEqualTo(other: Name): boolean {
    return this.value === other.value;
  }

  valueOf(): string {
    return this.value;
  }

  toPersistence(): string {
    return this.value;
  }
}
