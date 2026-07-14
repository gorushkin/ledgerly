import { passwordValidation } from '@ledgerly/shared/validation';
import bcrypt from 'bcryptjs';
import { InvalidPasswordError } from 'src/domain/domain.errors';

import { parseValueObject } from './parseValueObject';

const hashingSaltRounds = 10;

export class Password {
  private readonly value: string;

  private constructor(value: string) {
    this.value = value;
    Object.freeze(this);
  }

  static async create(value: string): Promise<Password> {
    parseValueObject(
      value,
      passwordValidation,
      (cause) => new InvalidPasswordError(cause),
    );

    const hashed = await bcrypt.hash(value, hashingSaltRounds);

    return new Password(hashed);
  }

  async compare(password: string): Promise<boolean> {
    return bcrypt.compare(password, this.value);
  }

  static restore(encryptedPassword: string): Password {
    return new Password(encryptedPassword);
  }

  private static readonly BCRYPT_HASH_PREFIX = '$2';

  verify(): boolean {
    return this.value.startsWith(Password.BCRYPT_HASH_PREFIX);
  }

  valueOf(): string {
    return this.value;
  }
}
