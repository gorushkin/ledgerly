import { passwordValidation } from '@ledgerly/shared/validation';
import bcrypt from 'bcryptjs';
import { InvalidPasswordError } from 'src/domain/domain.errors';

import { parseValueObject } from './parseValueObject';

const hashingSaltRounds = 10;

export class Password {
  private _value: string;

  private constructor(value: string) {
    this._value = value;
  }

  static async create(value: string): Promise<Password> {
    parseValueObject(
      value,
      passwordValidation,
      () => new InvalidPasswordError(),
    );

    const hashed = await bcrypt.hash(value, hashingSaltRounds);

    return new Password(hashed);
  }

  async compare(password: string): Promise<boolean> {
    return bcrypt.compare(password, this._value);
  }

  static fromPersistence(encryptedPassword: string): Password {
    return new Password(encryptedPassword);
  }

  private static readonly BCRYPT_HASH_PREFIX = '$2';

  verify(): boolean {
    return this._value.startsWith(Password.BCRYPT_HASH_PREFIX);
  }

  valueOf(): string {
    return this._value;
  }
}
