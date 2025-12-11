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

type OperationData = {
  accountKey: string;
  amount: Amount;
  description?: string;
};

export class EntryBuilder {
  constructor(public transaction: Transaction) {}
  description = '';
  operationsData: OperationData[] = [];
  user: User | null = null;
  self: Entry | null = null;

  withDescription(desc: string) {
    this.description = desc;
    return this;
  }

  withUser(user: User) {
    this.user = user;
    return this;
  }

  withOperation({
    accountKey,
    amount,
    description,
  }: {
    accountKey: string;
    amount?: Amount;
    description?: string;
  }) {
    this.operationsData.push({
      accountKey,
      amount: amount!,
      description: description!,
    });

    return this;
  }
}
export class TransactionBuilder {
  _entries: EntryBuilder[] = [];
  user: User | null = null;
  _accounts = new Map<string, Account>();
  accountsMap = new Map<UUID, Account>();
  _systemAccounts = new Map<CurrencyCode, Account>();
  self: Transaction | null = null;

  static create() {
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

  withEntry(description: string, operations: OperationData[] = []) {
    this.validateUser();

    this.setSelf();

    const builder = new EntryBuilder(this.self)
      .withUser(this.user)
      .withDescription(description);

    operations.forEach((op) => {
      builder.withOperation(op);
    });

    this._entries.push(builder);
    return this;
  }

  build() {
    this.validateUser();

    this.setSelf();

    this.validateUser();

    const entries: Entry[] = [];

    for (const b of this._entries) {
      const entry = Entry.create(this.user, this.self, b.description, []);
      entries.push(entry);

      const operations: Operation[] = [];

      for (const opData of b.operationsData) {
        const account = this._accounts.get(opData.accountKey)!;

        if (!account) {
          throw new Error(
            `Account with key ${opData.accountKey} not found in builder`,
          );
        }

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
      systemAccounts: this._systemAccounts,
      transaction: this.self,
      user: this.user,
    };
  }
}
