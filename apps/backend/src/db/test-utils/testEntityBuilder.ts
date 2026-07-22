import {
  UUID,
  CurrencyCode,
  IsoDateString,
  CommodityCodeString,
} from '@ledgerly/shared/types';
import {
  CreateOperationRequestDTO,
  CreateTransactionRequestDTO,
  EntityNotFoundError,
} from 'src/application';
import {
  Account,
  AccountType,
  Commodity,
  Operation,
  Transaction,
  User,
} from 'src/domain';
import {
  Amount,
  CommodityCode,
  Currency,
  DateValue,
  Name,
} from 'src/domain/domain-core';
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
  commodity: Commodity;
  accounts: string[];
  operations: OperationDataForTransaction[];
  settings?: Partial<TransactionProps>;
};

export type TransactionRequestBuilderResult = {
  accountsMap: Map<UUID, Account>;
  accounts: Account[];
  commodities: Commodity[];
  transactionContext: TransactionBuildContext;
  getAccountByKey: (key: string) => Account;
  getCommodityByKey: (code: string) => Commodity;
  getSystemAccountByCurrency: (currency: string) => Account;
  systemAccounts: Map<CurrencyCode, Account>;
  user: User;
  transactionDTO: CreateTransactionRequestDTO;
  transactionData: {
    description: string;
    postingDate: IsoDateString;
    transactionDate: IsoDateString;
    userId: UUID;
    commodityId: UUID;
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
  private readonly commoditiesMap = new Map<CommodityCodeString, Commodity>();
  private readonly systemAccounts = new Map<CurrencyCode, Account>();
  private readonly operationsData: OperationDataForTransaction[];
  private readonly postingDate: IsoDateString;
  private readonly transactionDate: IsoDateString;
  private readonly description: string;
  private readonly transactionCurrency: Currency;
  private readonly transactionCommodity: Commodity;

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

    this.transactionCommodity = Commodity.create(
      this.user,
      Name.create(`Commodity ${options.settings?.currencyCode ?? 'USD'}`),
      CommodityCode.create(options.settings?.currencyCode ?? 'USD'),
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
      const code = CommodityCode.create(currencyCode);

      const commodity = Commodity.create(
        this.user,
        Name.create(`Commodity ${currencyCode}`),
        code,
      );

      const account = Account.create(
        this.user,
        commodity,
        Name.create(`Account ${currencyCode}`),
        `Account ${currencyCode}`,
        Amount.create('0'),
        Currency.create(currencyCode),
        AccountType.create('asset'),
      );

      this.accounts.set(currencyCode, account);
      this.accountsMap.set(account.getId().valueOf(), account);
      this.commoditiesMap.set(code.valueOf(), commodity);
    });

    this.createSystemAccounts();
  }

  private getCommodityByCurrency(currency: string): Commodity {
    const code = CommodityCode.create(currency);
    const commodity = this.commoditiesMap.get(code.valueOf());

    if (!commodity) {
      throw new EntityNotFoundError({ entityType: Commodity.entityType });
    }

    return commodity;
  }

  private createSystemAccounts(): void {
    this.accounts.forEach((account) => {
      const currencyCode = account.currency.valueOf();
      const commodity = this.getCommodityByCurrency(currencyCode);
      const systemAccount = Account.create(
        this.user,
        commodity,
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

  getCommodityByKey(code: string): Commodity {
    const commodity = this.commoditiesMap.get(code as CommodityCodeString);

    if (!commodity) {
      throw new EntityNotFoundError({ entityType: Commodity.entityType });
    }

    return commodity;
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
      commodityId: this.getCommodityByCurrency(
        this.transactionCurrency.valueOf(),
      )
        .getId()
        .valueOf(),
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
      commodities: Array.from(this.commoditiesMap.values()),
      getAccountByKey: this.getAccountByKey.bind(this),
      getCommodityByKey: this.getCommodityByKey.bind(this),
      getSystemAccountByCurrency: this.getSystemAccountByCurrency.bind(this),
      operationsData: this.operationsData,
      systemAccounts: this.systemAccounts,
      transactionContext: {
        accountsMap: this.accountsMap,
        systemAccountsMap: this.systemAccounts,
      },
      transactionData: {
        commodityId: this.getCommodityByCurrency(
          this.transactionCurrency.valueOf(),
        )
          .getId()
          .valueOf(),
        description: this.description,
        postingDate: this.postingDate,
        transactionDate: this.transactionDate,
        userId: this.user.getId().valueOf(),
      },
      transactionDTO: {
        commodityId: this.getCommodityByCurrency(
          this.transactionCurrency.valueOf(),
        )
          .getId()
          .valueOf(),
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

    const commodity = this.getCommodityByCurrency(
      requestFixture.transactionDTO.currencyCode,
    );

    const transaction = Transaction.create(
      this.user.getId(),
      commodity,
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
