import { UUID, CurrencyCode, IsoDateString } from '@ledgerly/shared/types';
import {
  CreateOperationRequestDTO,
  CreateTransactionRequestDTO,
  EntityNotFoundError,
} from 'src/application';
import { Account, AccountType, Operation, Transaction, User } from 'src/domain';
import { Amount, Currency, DateValue, Name } from 'src/domain/domain-core';
import { TransactionBuildContext } from 'src/domain/transactions/types';

type OperationDataForTransaction = {
  accountKey: string;
  amount: string;
  value?: string;
  description?: string;
};

export type TransactionProps = {
  user?: User;
  postingDate?: string;
  transactionDate?: string;
  description?: string;
  currencyCode: string;
};

export type TransactionBuilderResult = {
  accountsMap: Map<UUID, Account>;
  accounts: Account[];
  transactionContext: TransactionBuildContext;
  getAccountByKey: (key: string) => Account;
  getSystemAccountByCurrency: (currency: string) => Account;
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
  operationsData: OperationDataForTransaction[];
  operations: Operation[];
};

export class TransactionBuilder {
  operations: Operation[] = [];
  operationsData: OperationDataForTransaction[] = [];
  postingDate: IsoDateString = DateValue.restore('2023-01-01').valueOf();
  transactionDate: IsoDateString = DateValue.restore('2023-01-01').valueOf();
  description = 'Test Transaction';
  user: User | null = null;
  accounts = new Map<string, Account>();
  accountsMap = new Map<UUID, Account>();
  systemAccounts = new Map<CurrencyCode, Account>();
  transaction: Transaction | null = null;
  transactionCurrency: Currency = Currency.create('USD');
  addOperations = false;

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

  withSettings(settings: TransactionProps): this {
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

    if (settings.currencyCode) {
      this.transactionCurrency = Currency.create(settings.currencyCode);
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

    return this.withSystemAccounts();
  }

  private withSystemAccounts(): this {
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

  attachOperations() {
    this.addOperations = true;
    return this;
  }

  private ensureTransaction(): asserts this is { transaction: Transaction } {
    this.validateUser();

    if (this.transaction) {
      return;
    }

    this.transaction = Transaction.create(this.user.getId(), {
      currency: this.transactionCurrency,
      description: 'Test Transaction',
      operations: [],
      postingDate: DateValue.restore('2023-01-01'),
      transactionDate: DateValue.restore('2023-01-01'),
    });
  }

  withOperations(operationsData: OperationDataForTransaction[]): this {
    this.validateUser();
    this.ensureTransaction();

    this.operationsData.push(...operationsData);

    const operations = operationsData.map((op) => {
      const account = this.getAccountByKey(op.accountKey);
      const amount = Amount.create(op.amount);
      const value = op.value ? Amount.create(op.value) : amount;

      return Operation.create(
        this.user.getId(),
        account,
        this.transaction,
        amount,
        value,
        op.description ?? 'Test Operation',
      );
    });

    this.operations.push(...operations);

    return this;
  }

  getAccountByKey(key: string): Account {
    const account = this.accounts.get(key);

    if (!account) {
      throw new EntityNotFoundError(`Account with key ${key} not found`);
    }
    return account;
  }

  getSystemAccountByCurrency(currency: string): Account {
    const account = this.systemAccounts.get(currency as CurrencyCode);

    if (!account) {
      throw new EntityNotFoundError(
        `System account with currency ${currency} not found`,
      );
    }
    return account;
  }

  build(): TransactionBuilderResult {
    this.ensureTransaction();

    this.validateUser();

    const operations = this.operationsData.map<CreateOperationRequestDTO>(
      (op) => {
        const amount = Amount.create(op.amount).valueOf();
        const value = op.value ? Amount.create(op.value).valueOf() : amount;

        return {
          accountId: this.getAccountByKey(op.accountKey).getId().valueOf(),
          amount,
          description: op.description ?? 'Test Operation',
          transactionId: this.transaction.getId().valueOf(),
          value,
        };
      },
    );

    if (this.addOperations) {
      this.transaction.attachOperations(this.operations);
    }

    return {
      accounts: Array.from(this.accountsMap.values()),
      accountsMap: this.accountsMap,
      getAccountByKey: this.getAccountByKey.bind(this),
      getSystemAccountByCurrency: this.getSystemAccountByCurrency.bind(this),
      operations: this.operations,
      operationsData: this.operationsData,
      systemAccounts: this.systemAccounts,
      transaction: this.transaction,
      transactionContext: {
        accountsMap: this.accountsMap,
        systemAccountsMap: this.systemAccounts,
      },
      transactionData: {
        description: this.description,
        postingDate: this.postingDate,
        transactionDate: this.transactionDate,
        userId: this.user.getId().valueOf(),
      },
      transactionDTO: {
        currencyCode: this.transactionCurrency.valueOf(),
        description: this.description,
        operations,
        postingDate: this.postingDate,
        transactionDate: this.transactionDate,
      },
      user: this.user,
    };
  }
}
