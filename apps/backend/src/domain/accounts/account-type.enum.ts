import { InvalidAccountTypeError } from 'src/domain/domain.errors';

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
  private constructor(private readonly value: AccountTypeValue) {
    Object.freeze(this);
  }

  static create(type: AccountTypeValue): AccountType {
    if (!ACCOUNT_TYPE_VALUES.includes(type)) {
      throw new InvalidAccountTypeError(type);
    }

    return new AccountType(type);
  }

  static restore(type: AccountTypeValue): AccountType {
    return AccountType.create(type);
  }

  toString(): string {
    return this.value;
  }

  equals(other: AccountType): boolean {
    return this.value === other.value;
  }

  valueOf(): AccountTypeValue {
    return this.value;
  }

  isSystemType(): boolean {
    return SYSTEM_ACCOUNT_TYPE_VALUES.includes(this.value);
  }
}
