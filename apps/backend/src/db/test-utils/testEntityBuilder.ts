import { UUID, CurrencyCode } from '@ledgerly/shared/types';
import { createAccount } from 'src/db/createTestUser';
import {
  Account,
  AccountType,
  Entry,
  Operation,
  Transaction,
  User,
} from 'src/domain';
import { Amount, Currency, DateValue, Name } from 'src/domain/domain-core';

type OperationDataForTransaction = {
  accountKey: string;
  amount: Amount;
  description?: string;
};

type OperationDataForEntry = {
  account: Account;
  amount: Amount;
  description?: string;
};

export class EntryBuilder {
  constructor(public transaction: Transaction) {}
  description = '';
  operationsData: OperationDataForEntry[] = [];
  user: User | null = null;
  self: Entry | null = null;

  validateUser(): asserts this is { user: User } {
    if (!this.user) {
      throw new Error('User must be set before creating transaction');
    }
  }

  withDescription(desc: string) {
    this.description = desc;
    return this;
  }

  withUser(user: User) {
    this.user = user;
    return this;
  }

  private setSelf(): asserts this is { self: Transaction } {
    this.validateUser();

    if (this.self) {
      return;
    }

    this.self = Entry.create(this.user, this.transaction, this.description, []);
  }

  withOperation({ account, amount, description = '' }: OperationDataForEntry) {
    this.operationsData.push({
      account,
      amount,
      description: description,
    });

    return this;
  }

  build() {
    if (!this.user) {
      throw new Error('User must be set before building Entry');
    }

    this.self ??= Entry.create(
      this.user,
      this.transaction,
      this.description,
      [],
    );

    const operations: Operation[] = [];

    for (const opData of this.operationsData) {
      const account = opData.account;

      const operation = Operation.create(
        this.user,
        account,
        this.self,
        opData.amount,
        opData.description ?? 'Test Operation',
      );

      operations.push(operation);
    }

    this.self.addOperations(operations);
    return this.self;
  }
}

export class TransactionBuilder {
  _entries: EntryBuilder[] = [];
  user: User | null = null;
  _accounts = new Map<string, Account>();
  accountsMap = new Map<UUID, Account>();
  _systemAccounts = new Map<CurrencyCode, Account>();
  self: Transaction | null = null;

  static create(user?: User) {
    if (user) {
      return new TransactionBuilder().withUser(user);
    }
    return new TransactionBuilder();
  }

  withUser(user: User) {
    this.user = user;
    return this;
  }

  validateUser(): asserts this is { user: User } {
    if (!this.user) {
      throw new Error('User must be set before creating transaction');
    }
  }

  withAccounts(currencyCodes: string[]) {
    for (const currencyCode of currencyCodes) {
      const name = Name.create(`Account ${currencyCode}`);
      const account = Account.create(
        this.user!,
        name,
        `Account ${currencyCode}`,
        Amount.create('0'),
        Currency.create(currencyCode),
        AccountType.create('asset'),
      );
      this._accounts.set(currencyCode, account);
      this.accountsMap.set(account.getId().valueOf(), account);
    }
    return this;
  }

  withSystemAccounts() {
    for (const [_, account] of this._accounts) {
      const systemAccount = createAccount(this.user!, {
        currency: Currency.create(account.currency.valueOf()),
      });
      this._systemAccounts.set(systemAccount.currency.valueOf(), systemAccount);
    }
    return this;
  }

  private setSelf(): asserts this is { self: Transaction } {
    this.validateUser();

    if (this.self) {
      return;
    }

    this.self = Transaction.create(
      this.user.getId(),
      'Test Transaction',
      DateValue.restore('2023-01-01'),
      DateValue.restore('2023-01-01'),
    );
  }

  withEntry(
    description: string,
    operations: OperationDataForTransaction[] = [],
  ) {
    this.validateUser();

    this.setSelf();

    const builder = new EntryBuilder(this.self)
      .withUser(this.user)
      .withDescription(description);

    operations.forEach((op) => {
      const account = this.getAccountByKey(op.accountKey);

      builder.withOperation({ ...op, account });
    });

    this._entries.push(builder);
    return this;
  }

  getAccountByKey(key: string): Account {
    const account = this._accounts.get(key);
    if (!account) {
      throw new Error(`Account with key ${key} not found`);
    }
    return account;
  }

  build() {
    this.setSelf();

    this.validateUser();

    const entries: Entry[] = [];

    for (const b of this._entries) {
      const entry = Entry.create(this.user, this.self, b.description, []);
      entries.push(entry);

      const operations: Operation[] = [];

      for (const opData of b.operationsData) {
        const account = opData.account;

        const operation = Operation.create(
          this.user,
          account,
          entry,
          opData.amount,
          opData.description ?? 'Test Operation',
        );

        operations.push(operation);
      }

      entry.addOperations(operations);
      this.self.addEntry(entry);
    }

    return {
      accountsMap: this.accountsMap,
      entries,
      entryContext: {
        accountsMap: this.accountsMap,
        systemAccountsMap: this._systemAccounts,
      },
      getAccountByKey: this.getAccountByKey.bind(this),
      systemAccounts: this._systemAccounts,
      transaction: this.self,
      user: this.user,
    };
  }
}
