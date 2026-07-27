import {
  UUID,
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
import { Amount, CommodityCode, DateValue, Name } from 'src/domain/domain-core';
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
  currency: string;
};

export type TransactionBuilderOptions = {
  user: User;
  operations: OperationDataForTransaction[];
  settings?: Partial<TransactionProps>;
  currencies: string[];
};

export type TransactionRequestBuilderResult = {
  accountsMap: Map<UUID, Account>;
  commoditiesMap: Map<CommodityCodeString, Commodity>;
  commoditiesMapById: Map<UUID, Commodity>;
  accounts: Account[];
  commodities: Commodity[];
  transactionContext: TransactionBuildContext;
  getAccountByKey: (key: string) => Account;
  getCommodityByKey: (code: string) => Commodity;
  user: User;
  transactionDTO: CreateTransactionRequestDTO;
  transactionData: {
    description: string;
    postingDate: IsoDateString;
    transactionDate: IsoDateString;
    userId: UUID;
    commodityId: UUID;
    transactionCommodity: Commodity;
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
  private readonly commoditiesMapByCommodityCode = new Map<
    CommodityCodeString,
    Commodity
  >();
  private readonly commoditiesMapById = new Map<UUID, Commodity>();
  private readonly operationsData: OperationDataForTransaction[];
  private readonly postingDate: IsoDateString;
  private readonly transactionDate: IsoDateString;
  private readonly description: string;
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

    this.createAccounts(options.currencies);
    this.validateAccountKeys();

    const transactionCommodityCode = options.settings?.currency ?? 'USD';

    const transactionCommodity = this.commoditiesMapByCommodityCode.get(
      transactionCommodityCode as CommodityCodeString,
    );

    if (!transactionCommodity) {
      throw new EntityNotFoundError({ entityType: Commodity.entityType });
    }

    this.transactionCommodity = transactionCommodity;
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

  private validateAccountKeys(): void {
    const invalidKeys = this.operationsData.filter(
      (operation) => !this.accounts.has(operation.accountKey),
    );

    if (invalidKeys.length > 0) {
      throw new EntityNotFoundError({ entityType: Account.entityType });
    }
  }

  private createAccounts(currencyCodes: string[]): void {
    currencyCodes.forEach((commodityCode) => {
      const code = CommodityCode.create(commodityCode);

      const commodity = Commodity.create(this.user, {
        code: code.valueOf(),
        name: `Commodity ${commodityCode}`,
      });

      const account = Account.create(this.user, {
        commodityId: commodity.getId(),
        description: `Account ${commodityCode}`,
        initialBalance: Amount.create('0'),
        name: Name.create(`Account ${commodityCode}`),
        type: AccountType.create('asset'),
      });

      this.accounts.set(commodityCode, account);
      this.accountsMap.set(account.getId().valueOf(), account);
      this.commoditiesMapByCommodityCode.set(code.valueOf(), commodity);
      this.commoditiesMapById.set(commodity.getId().valueOf(), commodity);
    });
  }

  private getCommodityById(commodityId: UUID): Commodity {
    const commodity = this.commoditiesMapById.get(commodityId);

    if (!commodity) {
      throw new EntityNotFoundError({ entityType: Commodity.entityType });
    }

    return commodity;
  }

  getAccountByKey(key: string): Account {
    const account = this.accounts.get(key);

    if (!account) {
      throw new EntityNotFoundError({ entityType: Account.entityType });
    }

    return account;
  }

  getCommodityByKey(code: string): Commodity {
    const commodity = this.commoditiesMapByCommodityCode.get(
      code as CommodityCodeString,
    );

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
      commodityId: this.transactionCommodity.getId(),
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
      commodities: Array.from(this.commoditiesMapByCommodityCode.values()),
      commoditiesMap: this.commoditiesMapByCommodityCode,
      commoditiesMapById: this.commoditiesMapById,
      getAccountByKey: this.getAccountByKey.bind(this),
      getCommodityByKey: this.getCommodityByKey.bind(this),
      operationsData: this.operationsData,
      transactionContext: {
        accountsMap: this.accountsMap,
      },

      transactionData: {
        commodityId: this.transactionCommodity.getId().valueOf(),
        description: this.description,
        postingDate: this.postingDate,
        transactionCommodity: this.transactionCommodity,
        transactionDate: this.transactionDate,
        userId: this.user.getId().valueOf(),
      },
      transactionDTO: {
        commodityId: this.getCommodityById(
          this.transactionCommodity.getId().valueOf(),
        )
          .getId()
          .valueOf(),
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
