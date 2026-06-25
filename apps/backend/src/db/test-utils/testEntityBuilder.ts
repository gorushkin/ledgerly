import { UUID, CurrencyCode, IsoDateString } from '@ledgerly/shared/types';
import {
  CreateOperationRequestDTO,
  CreateTransactionRequestDTO,
  EntityNotFoundError,
} from 'src/application';
import { Account, AccountType, Operation, Transaction, User } from 'src/domain';
import { Amount, Currency, DateValue, Name } from 'src/domain/domain-core';
import {
  CreateTransactionProps,
  TransactionBuildContext,
} from 'src/domain/transactions/types';

import { TransactionWithRelations } from '../schema';

export type OperationDataForTransaction = {
  accountKey: string;
  amount: string;
  value?: string;
  description?: string;
};

export type TransactionProps = {
  postingDate?: string;
  transactionDate?: string;
  description?: string;
  currencyCode: string;
};

export type TransactionBuilderOptions = {
  user: User;
  accounts: string[];
  operations: OperationDataForTransaction[];
  settings?: Partial<TransactionProps>;
};

export type TransactionRequestBuilderResult = {
  accountsMap: Map<UUID, Account>;
  accounts: Account[];
  transactionContext: TransactionBuildContext;
  getAccountByKey: (key: string) => Account;
  getSystemAccountByCurrency: (currency: string) => Account;
  systemAccounts: Map<CurrencyCode, Account>;
  user: User;
  transactionDTO: CreateTransactionRequestDTO;
  transactionData: {
    description: string;
    postingDate: IsoDateString;
    transactionDate: IsoDateString;
    userId: UUID;
  };
  operationsData: OperationDataForTransaction[];
};

export type TransactionBuilderResult = TransactionRequestBuilderResult & {
  transaction: Transaction;
  operations: Operation[];
};

export type TransactionPersistenceBuilderResult = TransactionBuilderResult & {
  transactionWithRelations: TransactionWithRelations;
};

export class TransactionBuilder {
  private readonly user: User;
  private readonly accounts = new Map<string, Account>();
  private readonly accountsMap = new Map<UUID, Account>();
  private readonly systemAccounts = new Map<CurrencyCode, Account>();
  private readonly operationsData: OperationDataForTransaction[];
  private readonly postingDate: IsoDateString;
  private readonly transactionDate: IsoDateString;
  private readonly description: string;
  private readonly transactionCurrency: Currency;

  private constructor(options: TransactionBuilderOptions) {
    this.user = options.user;
    this.operationsData = [...options.operations];
    this.postingDate = DateValue.restore(
      options.settings?.postingDate ?? '2023-01-01',
    ).valueOf();
    this.transactionDate = DateValue.restore(
      options.settings?.transactionDate ?? '2023-01-01',
    ).valueOf();
    this.description = options.settings?.description ?? 'Test Transaction';
    this.transactionCurrency = Currency.create(
      options.settings?.currencyCode ?? 'USD',
    );

    this.createAccounts(options.accounts);
  }

  static request(
    options: TransactionBuilderOptions,
  ): TransactionRequestBuilderResult {
    return new TransactionBuilder(options).buildRequest();
  }

  static transaction(
    options: TransactionBuilderOptions,
  ): TransactionBuilderResult {
    return new TransactionBuilder(options).buildTransaction();
  }

  static persistence(
    options: TransactionBuilderOptions,
  ): TransactionPersistenceBuilderResult {
    return new TransactionBuilder(options).buildPersistence();
  }

  private createAccounts(currencyCodes: string[]): void {
    currencyCodes.forEach((currencyCode) => {
      const account = Account.create(
        this.user,
        Name.create(`Account ${currencyCode}`),
        `Account ${currencyCode}`,
        Amount.create('0'),
        Currency.create(currencyCode),
        AccountType.create('asset'),
      );

      this.accounts.set(currencyCode, account);
      this.accountsMap.set(account.getId().valueOf(), account);
    });

    this.createSystemAccounts();
  }

  private createSystemAccounts(): void {
    this.accounts.forEach((account) => {
      const currencyCode = account.currency.valueOf();
      const systemAccount = Account.create(
        this.user,
        Name.create(`System Account ${currencyCode}`),
        `System Account for ${currencyCode}`,
        Amount.create('0'),
        Currency.create(currencyCode),
        AccountType.create('currencyTrading'),
      );

      this.systemAccounts.set(currencyCode, systemAccount);
      this.accountsMap.set(systemAccount.getId().valueOf(), systemAccount);
    });
  }

  getAccountByKey(key: string): Account {
    const account = this.accounts.get(key);

    if (!account) {
      throw new EntityNotFoundError({ entityType: Account.entityType });
    }

    return account;
  }

  getSystemAccountByCurrency(currency: string): Account {
    const account = this.systemAccounts.get(currency as CurrencyCode);

    if (!account) {
      throw new EntityNotFoundError({ entityType: Account.entityType });
    }

    return account;
  }

  private buildOperationsDTO(): CreateOperationRequestDTO[] {
    return this.operationsData.map((operation) => {
      const amount = Amount.create(operation.amount).valueOf();
      const value = operation.value
        ? Amount.create(operation.value).valueOf()
        : amount;

      return {
        accountId: this.getAccountByKey(operation.accountKey).getId().valueOf(),
        amount,
        description: operation.description ?? 'Test Operation',
        value,
      };
    });
  }

  private buildTransactionProps(): CreateTransactionProps {
    return {
      currency: this.transactionCurrency,
      description: this.description,
      operations: this.operationsData.map((operation) => {
        const amount = Amount.create(operation.amount);

        return {
          account: this.getAccountByKey(operation.accountKey),
          amount,
          description: operation.description ?? 'Test Operation',
          value: operation.value ? Amount.create(operation.value) : amount,
        };
      }),
      postingDate: DateValue.restore(this.postingDate),
      transactionDate: DateValue.restore(this.transactionDate),
    };
  }

  private buildRequest(): TransactionRequestBuilderResult {
    return {
      accounts: Array.from(this.accountsMap.values()),
      accountsMap: this.accountsMap,
      getAccountByKey: this.getAccountByKey.bind(this),
      getSystemAccountByCurrency: this.getSystemAccountByCurrency.bind(this),
      operationsData: this.operationsData,
      systemAccounts: this.systemAccounts,
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
        operations: this.buildOperationsDTO(),
        postingDate: this.postingDate,
        transactionDate: this.transactionDate,
      },
      user: this.user,
    };
  }

  private buildTransaction(): TransactionBuilderResult {
    const requestFixture = this.buildRequest();
    const transaction = Transaction.create(
      this.user.getId(),
      this.buildTransactionProps(),
    );

    return {
      ...requestFixture,
      operations: transaction.getOperations(),
      transaction,
    };
  }

  private buildPersistence(): TransactionPersistenceBuilderResult {
    const transactionFixture = this.buildTransaction();

    return {
      ...transactionFixture,
      transactionWithRelations: transactionFixture.transaction.toSnapshot(),
    };
  }
}
