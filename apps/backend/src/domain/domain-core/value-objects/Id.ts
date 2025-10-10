import { UUID } from '@ledgerly/shared/types';
import { uuid } from '@ledgerly/shared/validation';

export class Id {
  private readonly value: UUID;
  private constructor(value: string) {
    const parsed = uuid.safeParse(value);

    if (!parsed.success) {
      throw new Error('Invalid UUID format');
    }

    this.value = parsed.data;
    Object.freeze(this);
  }

  static create(): Id {
    const id = crypto.randomUUID() as UUID;
    return new Id(id);
  }

  static fromPersistence = (value: string): Id => {
    return new Id(value);
  };

  toString(): string {
    return this.value;
  }

  isEqualTo(other: Id | string): boolean {
    return this.value === (other instanceof Id ? other.value : other);
  }

  valueOf(): UUID {
    return this.value;
  }

  toJSON(): string {
    return this.value;
  }
}
