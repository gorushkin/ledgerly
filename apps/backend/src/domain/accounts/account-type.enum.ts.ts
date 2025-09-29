type AccountTypeValue = 'asset' | 'liability' | 'equity' | 'income' | 'expense';

export class AccountType {
  private constructor(private readonly _value: AccountTypeValue) {}

  static create(type: string): AccountType {
    if (
      type !== 'asset' &&
      type !== 'liability' &&
      type !== 'equity' &&
      type !== 'income' &&
      type !== 'expense'
    ) {
      throw new Error(`Invalid account type: ${type}`);
    }

    return new AccountType(type);
  }

  toString(): string {
    return this._value;
  }

  equals(other: AccountType): boolean {
    return this._value === other._value;
  }

  valueOf(): AccountTypeValue {
    return this._value;
  }
}
