type AccountTypeValue =
  | 'asset'
  | 'liability'
  | 'equity'
  | 'income'
  | 'expense'
  | 'currencyTrading';

const ACCOUNT_TYPES: AccountTypeValue[] = [
  'asset',
  'liability',
  'equity',
  'income',
  'expense',
  'currencyTrading',
];

const SYSTEM_ACCOUNT_TYPES: AccountTypeValue[] = ['currencyTrading'];

const ACCOUNT_TYPE_VALUES = ACCOUNT_TYPES as [
  AccountTypeValue,
  ...AccountTypeValue[],
];

const SYSTEM_ACCOUNT_TYPE_VALUES = SYSTEM_ACCOUNT_TYPES as [
  AccountTypeValue,
  ...AccountTypeValue[],
];

export class AccountType {
  private constructor(private readonly _value: AccountTypeValue) {}

  static create(type: AccountTypeValue): AccountType {
    if (!ACCOUNT_TYPE_VALUES.includes(type)) {
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

  isSystemType(): boolean {
    return SYSTEM_ACCOUNT_TYPE_VALUES.includes(this._value);
  }
}
