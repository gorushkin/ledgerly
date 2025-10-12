import { passwordValidation } from '@ledgerly/shared/validation';
import bcrypt from 'bcryptjs';

const hashingSaltRounds = 10;

export class Password {
  private _value: string;

  private constructor(value: string) {
    this._value = value;
  }

  static async create(value: string): Promise<Password> {
    const parsed = passwordValidation.safeParse(value);

    if (!parsed.success) {
      throw new Error(parsed.error.message);
    }

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
