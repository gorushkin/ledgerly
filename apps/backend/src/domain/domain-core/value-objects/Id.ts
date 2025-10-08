import { UUID } from '@ledgerly/shared/types';
import { uuid } from '@ledgerly/shared/validation';

export class Id {
  private readonly _value: UUID;
  private constructor(value: string) {
    const parsed = uuid.parse(value);

    if (!parsed) {
      throw new Error('Invalid UUID format');
    }

    this._value = parsed;
  }

  static create(): Id {
    const id = crypto.randomUUID() as UUID;
    return new Id(id);
  }

  static restore = (value: string): Id => {
    return new Id(value);
  };

  toString(): string {
    return this._value;
  }

  equals(other: Id): boolean {
    return this._value === other._value;
  }

  valueOf(): UUID {
    return this._value;
  }
}
