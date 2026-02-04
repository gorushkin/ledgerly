import { UUID, CurrencyCode, IsoDateString } from '@ledgerly/shared/types';
import {
  CreateEntryRequestDTO,
  CreateOperationRequestDTO,
  CreateTransactionRequestDTO,
  EntityNotFoundError,
} from 'src/application';
import { EntryContext } from 'src/application/services/EntriesService/entries.updater';
import { Account, AccountType, Entry, Transaction, User } from 'src/domain';
import { Amount, Currency, DateValue, Name } from 'src/domain/domain-core';

type OperationDataForTransaction = {
  accountKey: string;
  amount: string;
  description?: string;
};

type OperationDataForEntry = {
  account: Account;
  amount: Amount;
  description?: string;
};

export class EntryBuilder {
  constructor(
    public transaction: Transaction,
    public entryContext: EntryContext,
  ) {}
  description = '';
  operationsData: OperationDataForEntry[] = [];
  user: User | null = null;
  entry: Entry | null = null;

  validateUser(): asserts this is { user: User } {
    if (!this.user) {
      throw new Error('User must be set before creating transaction');
    }
  }

  withDescription(desc: string): this {
    this.description = desc;
    return this;
  }

  withUser(user: User): this {
    this.user = user;
    return this;
  }

  withOperation({
    account,
    amount,
    description = '',
  }: OperationDataForEntry): this {
    this.operationsData.push({
      account,
      amount,
      description,
    });
    return this;
  }

  build() {
    if (!this.user) {
      throw new Error('User must be set before building Entry');
    }

    if (this.operationsData.length !== 2) {
      throw new Error('At least one operation must be added to the entry');
    }

    const operations: CreateEntryRequestDTO['operations'] =
      this.operationsData.map((op) => {
        const operationData: CreateOperationRequestDTO = {
          accountId: op.account.getId().valueOf(),
          amount: op.amount.valueOf(),
          description: op.description ?? 'Test Operation',
        };
        return operationData;
      }) as [CreateOperationRequestDTO, CreateOperationRequestDTO];

    const entryData: CreateEntryRequestDTO = {
      description: this.description,
      operations,
    };

    this.entry ??= Entry.create(
      this.user.getId(),
      this.transaction.getId(),
      entryData,
      this.entryContext,
    );

    return this.entry;
  }
}

export type TransactionBuilderResult = {
  accountsMap: Map<UUID, Account>;
  entries: Entry[];
  entryContext: EntryContext;
  getAccountByKey: (key: string) => Account;
  systemAccounts: Map<CurrencyCode, Account>;
  transaction: Transaction;
  user: User;
  transactionDTO: CreateTransactionRequestDTO;
  transactionData: {
    description: string;
    postingDate: IsoDateString;
    transactionDate: IsoDateString;
    userId: UUID;
  };
  entryData: CreateEntryRequestDTO[];
  getSystemAccountByCurrency: (currencyCode: string) => Account;
  accounts: Account[];
};

export class TransactionBuilder {
  private entryBuilders: EntryBuilder[] = [];
  postingDate: IsoDateString = DateValue.restore('2023-01-01').valueOf();
  transactionDate: IsoDateString = DateValue.restore('2023-01-01').valueOf();
  description = 'Test Transaction';

  user: User | null = null;
  accounts = new Map<string, Account>();
  accountsMap = new Map<UUID, Account>();
  systemAccounts = new Map<CurrencyCode, Account>();
  transaction: Transaction | null = null;

  static create(user?: User): TransactionBuilder {
    const builder = new TransactionBuilder();
    return user ? builder.withUser(user) : builder;
  }

  withUser(user: User): this {
    this.user = user;
    return this;
  }

  withDescription(description: string): this {
    this.description = description;
    return this;
  }

  private validateUser(): asserts this is { user: User } {
    if (!this.user) {
      throw new Error('User must be set before creating transaction');
    }
  }

  withPostingDate(date: IsoDateString): this {
    this.postingDate = date;
    return this;
  }

  withTransactionDate(date: IsoDateString): this {
    this.transactionDate = date;
    return this;
  }

  withSettings(settings: {
    user?: User;
    postingDate?: string;
    transactionDate?: string;
    description?: string;
  }): this {
    if (settings.user) {
      this.user = settings.user;
    }
    if (settings.postingDate) {
      this.postingDate = settings.postingDate as IsoDateString;
    }
    if (settings.transactionDate) {
      this.transactionDate = settings.transactionDate as IsoDateString;
    }
    if (settings.description) {
      this.description = settings.description;
    }
    return this;
  }

  withAccounts(currencyCodes: string[]): this {
    this.validateUser();

    for (const currencyCode of currencyCodes) {
      const name = Name.create(`Account ${currencyCode}`);
      const account = Account.create(
        this.user,
        name,
        `Account ${currencyCode}`,
        Amount.create('0'),
        Currency.create(currencyCode),
        AccountType.create('asset'),
      );
      this.accounts.set(currencyCode, account);
      this.accountsMap.set(account.getId().valueOf(), account);
    }
    return this;
  }

  withSystemAccounts(): this {
    this.validateUser();

    for (const [_, account] of this.accounts) {
      const systemAccount = Account.create(
        this.user,
        Name.create(`System Account ${account.currency.valueOf()}`),
        `System Account for ${account.currency.valueOf()}`,
        Amount.create('0'),
        Currency.create(account.currency.valueOf()),
        AccountType.create('currencyTrading'),
      );
      this.systemAccounts.set(systemAccount.currency.valueOf(), systemAccount);
      this.accountsMap.set(systemAccount.getId().valueOf(), systemAccount);
    }
    return this;
  }

  private ensureTransaction(): asserts this is { transaction: Transaction } {
    this.validateUser();

    if (this.transaction) {
      return;
    }

    this.transaction = Transaction.create(
      this.user.getId(),
      {
        description: 'Test Transaction',
        entries: [],
        postingDate: DateValue.restore('2023-01-01').valueOf(),
        transactionDate: DateValue.restore('2023-01-01').valueOf(),
      },
      {
        accountsMap: this.accountsMap,
        systemAccountsMap: this.systemAccounts,
      },
    );
  }

  withEntry(
    description: string,
    operations: OperationDataForTransaction[] = [],
  ): this {
    this.validateUser();
    this.ensureTransaction();

    const builder = new EntryBuilder(this.transaction, {
      accountsMap: this.accountsMap,
      systemAccountsMap: this.systemAccounts,
    })
      .withUser(this.user)
      .withDescription(description);

    operations.forEach((op) => {
      const account = this.getAccountByKey(op.accountKey);
      const amount = Amount.create(op.amount);
      builder.withOperation({ ...op, account, amount });
    });

    this.entryBuilders.push(builder);
    return this;
  }

  withEntries(
    entries: {
      description: string;
      operations: OperationDataForTransaction[];
    }[],
  ): this {
    entries.forEach((entry) => {
      this.withEntry(entry.description, entry.operations);
    });
    return this;
  }

  getAccountByKey(key: string): Account {
    const account = this.accounts.get(key);

    if (!account) {
      throw new EntityNotFoundError(`Account with key ${key} not found`);
    }
    return account;
  }

  getSystemAccountByCurrency(currencyCode: string): Account {
    const account = this.systemAccounts.get(currencyCode as CurrencyCode);

    if (!account) {
      throw new EntityNotFoundError(
        `System account with currency ${currencyCode} not found`,
      );
    }
    return account;
  }

  build(): TransactionBuilderResult {
    this.ensureTransaction();

    this.validateUser();

    const entries = this.entryBuilders.map((builder) => {
      const entry = builder.build();
      this.transaction.attachEntries([entry]);
      return entry;
    });

    const accounts: Account[] = [];
    Array.from(this.accounts.values()).forEach((account) => {
      accounts.push(account);
    });

    Array.from(this.systemAccounts.values()).forEach((account) => {
      accounts.push(account);
    });

    return {
      accounts,
      accountsMap: this.accountsMap,
      entries,
      entryContext: {
        accountsMap: this.accountsMap,
        systemAccountsMap: this.systemAccounts,
      },
      entryData: entries.map((entry) => {
        const operations = entry
          .getOperations()
          .filter((op) => !op.isSystem)
          .map((op) => ({
            accountId: op.getAccountId().valueOf(),
            amount: op.amount.valueOf(),
            description: op.description ?? 'Test Operation',
          })) as [CreateOperationRequestDTO, CreateOperationRequestDTO];
        return {
          description: entry.description,
          operations,
        };
      }),
      getAccountByKey: this.getAccountByKey.bind(this),
      getSystemAccountByCurrency: this.getSystemAccountByCurrency.bind(this),
      systemAccounts: this.systemAccounts,
      transaction: this.transaction,
      transactionData: {
        description: this.description,
        postingDate: this.postingDate,
        transactionDate: this.transactionDate,
        userId: this.user.getId().valueOf(),
      },
      transactionDTO: {
        description: this.description,
        entries: entries.map((entry) => {
          const operations = entry
            .getOperations()
            .filter((op) => !op.isSystem)
            .map((op) => ({
              accountId: op.getAccountId().valueOf(),
              amount: op.amount.valueOf(),
              description: op.description ?? 'Test Operation',
            })) as [CreateOperationRequestDTO, CreateOperationRequestDTO];
          return {
            description: entry.description,
            operations,
          };
        }),
        postingDate: this.postingDate,
        transactionDate: this.transactionDate,
      },
      user: this.user,
    };
  }
}
