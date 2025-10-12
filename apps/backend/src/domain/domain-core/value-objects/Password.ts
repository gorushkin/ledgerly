import { passwordValidation } from '@ledgerly/shared/validation';
import bcrypt from 'bcryptjs';

const hashingSaltRounds = 10;

export class Password {
  private _value: string;

  private constructor(value: string) {
    this._value = value;
  }

  static create(value: string): Password {
    const parsed = passwordValidation.safeParse(value);

    if (!parsed.success) {
      throw new Error(parsed.error.message);
    }

    const hashed = bcrypt.hashSync(value, hashingSaltRounds);

    return new Password(hashed);
  }

  async compare(password: string): Promise<boolean> {
    return bcrypt.compare(password, this._value);
  }

  static fromPersistence(encryptedPassword: string): Password {
    return new Password(encryptedPassword);
  }

  verify(): boolean {
    return this._value.startsWith('$2');
  }

  valueOf(): string {
    return this._value;
  }
}
