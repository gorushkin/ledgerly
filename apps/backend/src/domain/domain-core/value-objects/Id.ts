import { UUID } from '@ledgerly/shared/types';
import { uuid } from '@ledgerly/shared/validation';
import { InvalidIdentifierError } from 'src/domain/domain.errors';

import { parseValueObject } from './parseValueObject';

export class Id {
  private readonly value: UUID;
  private constructor(value: string) {
    this.value = parseValueObject(
      value,
      uuid,
      (cause) => new InvalidIdentifierError(cause),
    );
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

  equals(other: Id | string): boolean {
    return this.value === (other instanceof Id ? other.value : other);
  }

  valueOf(): UUID {
    return this.value;
  }

  toJSON(): string {
    return this.value;
  }
}
