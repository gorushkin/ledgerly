import { CurrencyCode, IsoDatetimeString, UUID } from '@ledgerly/shared/types';
import { CreateEntryRequestDTO } from 'src/application';
import { EntryContext } from 'src/application/services/EntriesService/entries.updater';
import { EntryDbRow, EntryWithOperations } from 'src/db/schemas/entries';

import { Account } from '../accounts';
import {
  EntityIdentity,
  EntityTimestamps,
  Id,
  SoftDelete,
  ParentChildRelation,
  Timestamp,
  Amount,
  Currency,
} from '../domain-core';
import {
  UnbalancedEntryError,
  EmptyOperationsError,
  DeletedEntityOperationError,
  OperationOwnershipError,
  MissingOperationsError,
} from '../domain.errors';
import { Operation } from '../operations';
import { User } from '../users/user.entity';

import { EntrySnapshot, TradingOperationDTO } from './types';
export class Entry {
  private readonly identity: EntityIdentity;
  private timestamps: EntityTimestamps;
  private softDelete: SoftDelete;
  private readonly ownership: ParentChildRelation;
  private readonly transactionRelation: ParentChildRelation;
  private operations: Operation[] = [];

  private constructor(
    identity: EntityIdentity,
    timestamps: EntityTimestamps,
    public description: string,
    softDelete: SoftDelete,
    ownership: ParentChildRelation,
    transactionRelation: ParentChildRelation,
    private version = 0,
    operations?: Operation[],
  ) {
    this.identity = identity;
    this.timestamps = timestamps;
    this.softDelete = softDelete;
    this.ownership = ownership;
    this.transactionRelation = transactionRelation;
    this.operations = operations ?? [];
  }

  private getAccountFromMap(
    accountId: UUID,
    accountsMap: Map<UUID, Account>,
  ): Account {
    const account = accountsMap.get(accountId);

    if (!account) {
      throw new Error(`Account not found in map: ${accountId}`);
    }

    return account;
  }

  private getSystemAccountFromMap(
    currencyCode: CurrencyCode,
    currencySystemAccountsMap: Map<CurrencyCode, Account>,
  ): Account {
    const systemAccount = currencySystemAccountsMap.get(currencyCode);

    if (!systemAccount) {
      throw new Error(
        `System account not found in map for currency: ${currencyCode}`,
      );
    }

    return systemAccount;
  }

  private getSystemAccountDescription({
    amount,
    currency,
    direction,
  }: {
    amount: Amount;
    currency: CurrencyCode;
    direction: 'from' | 'to';
  }) {
    return `Currency exchange ${direction} ${currency} account: ${amount.valueOf()}`;
  }

  private addTradingOperations(
    user: User,
    entry: Entry,
    entryData: CreateEntryRequestDTO,
    [fromCurrency, toCurrency]: [Currency, Currency],
    systemAccountsMap: Map<CurrencyCode, Account>,
  ): [TradingOperationDTO, TradingOperationDTO] | [] {
    if (fromCurrency.isEqualTo(toCurrency)) {
      return [];
    }

    const [fromOperationDTO, toOperationDTO] = entryData.operations;

    const oppositeFromAmount = Amount.create(fromOperationDTO.amount).negate();
    const oppositeToAmount = Amount.create(toOperationDTO.amount).negate();

    const fromSystemAccount = this.getSystemAccountFromMap(
      fromCurrency.valueOf(),
      systemAccountsMap,
    );

    const toSystemAccount = this.getSystemAccountFromMap(
      toCurrency.valueOf(),
      systemAccountsMap,
    );

    const balancedFromOperationDTO: TradingOperationDTO = {
      account: fromSystemAccount,
      description: this.getSystemAccountDescription({
        amount: oppositeFromAmount,
        currency: fromSystemAccount.currency.valueOf(),
        direction: 'from',
      }),
      entry,
      rawAmount: oppositeFromAmount.valueOf(),
      user,
    };

    const balancedToOperationDTO: TradingOperationDTO = {
      account: toSystemAccount,
      description: this.getSystemAccountDescription({
        amount: oppositeToAmount,
        currency: toSystemAccount.currency.valueOf(),
        direction: 'to',
      }),
      entry,
      rawAmount: oppositeToAmount.valueOf(),
      user,
    };

    return [balancedFromOperationDTO, balancedToOperationDTO];
  }

  private validateInputOperationsAmounts(
    data: TradingOperationDTO[],
    entry: Entry,
  ) {
    const balancedAmount = data.reduce((balance, dto) => {
      const amount = Amount.create(dto.rawAmount);
      return balance.add(amount);
    }, Amount.create('0'));

    if (!balancedAmount.isZero()) {
      throw new UnbalancedEntryError(entry, balancedAmount);
    }
  }

  private createOperationsForEntry(
    user: User,
    entry: Entry,
    entryData: CreateEntryRequestDTO,
    accountsByIdMap: Map<UUID, Account>,
    currencySystemAccountsMap: Map<CurrencyCode, Account>,
  ) {
    this.validateOperationsLength(entryData.operations);
    const [fromOperationDTO, toOperationDTO] = entryData.operations;

    const fromAccount = this.getAccountFromMap(
      fromOperationDTO.accountId,
      accountsByIdMap,
    );

    const toAccount = this.getAccountFromMap(
      toOperationDTO.accountId,
      accountsByIdMap,
    );

    const tradingOperationsDTO = this.addTradingOperations(
      user,
      entry,
      entryData,
      [fromAccount.currency, toAccount.currency],
      currencySystemAccountsMap,
    );

    const dtos: TradingOperationDTO[] = [
      {
        account: fromAccount,
        description: fromOperationDTO.description,
        entry,
        rawAmount: fromOperationDTO.amount,
        user,
      },
      {
        account: toAccount,
        description: toOperationDTO.description,
        entry,
        rawAmount: toOperationDTO.amount,
        user,
      },
      ...tradingOperationsDTO,
    ];

    this.validateInputOperationsAmounts(dtos, entry);

    const operations = dtos.map((opDTO) => {
      return Operation.create(
        opDTO.user,
        opDTO.account,
        opDTO.entry,
        Amount.create(opDTO.rawAmount),
        opDTO.description,
      );
    });

    return operations;
  }

  static create(
    user: User,
    transactionId: Id,
    entryData: CreateEntryRequestDTO,
    entryContext: EntryContext,
  ): Entry {
    const identity = EntityIdentity.create();
    const timestamps = EntityTimestamps.create();
    const softDelete = SoftDelete.create();
    const ownership = ParentChildRelation.create(
      user.getId(),
      identity.getId(),
    );

    const transactionRelation = ParentChildRelation.create(
      transactionId,
      identity.getId(),
    );

    const entry = new Entry(
      identity,
      timestamps,
      entryData.description,
      softDelete,
      ownership,
      transactionRelation,
    );

    const operations = entry.createOperationsForEntry(
      user,
      entry,
      entryData,
      entryContext.accountsMap,
      entryContext.systemAccountsMap,
    );

    entry.addOperations(operations);

    entry.validateBalance();

    return entry;
  }

  getId(): Id {
    return this.identity.getId();
  }

  belongsToUser(userId: Id): boolean {
    return this.ownership.belongsToParent(userId);
  }

  belongsToTransaction(transactionId: Id): boolean {
    return this.transactionRelation.belongsToParent(transactionId);
  }

  getTransactionId(): Id {
    return this.transactionRelation.getParentId();
  }

  markAsDeleted(): void {
    this.softDelete = this.softDelete.markAsDeleted();
  }

  isDeleted(): boolean {
    return this.softDelete.isDeleted();
  }

  private markUpdated() {
    this.version += 1;
    this.timestamps = this.timestamps.touch();
  }

  getUpdatedAt(): Timestamp {
    return this.timestamps.getUpdatedAt();
  }

  getCreatedAt(): Timestamp {
    return this.timestamps.getCreatedAt();
  }

  toPersistence(): EntryDbRow {
    return {
      createdAt: this.getCreatedAt().valueOf(),
      description: this.description,
      id: this.identity.getId().valueOf(),
      isTombstone: this.isDeleted(),
      transactionId: this.getTransactionId().valueOf(),
      updatedAt: this.getUpdatedAt().valueOf(),
      userId: this.ownership.getParentId().valueOf(),
      version: this.version,
    };
  }

  private validateOperationsLength<T>(operations: T[]): void {
    if (operations.length === 0) {
      throw new EmptyOperationsError();
    }
  }

  private validateCanAddOperations(operations: Operation[]): void {
    if (this.isDeleted()) {
      throw new DeletedEntityOperationError('entry', 'add operations');
    }

    this.validateOperationsLength(operations);

    for (const operation of operations) {
      if (!operation.belongsToEntry(this)) {
        throw new OperationOwnershipError();
      }
    }
  }

  addOperations(operations: Operation[]): void {
    this.validateCanAddOperations(operations);

    this.operations.push(...operations);
    this.markUpdated();
  }

  hasOperations(): boolean {
    return this.operations.length > 0;
  }

  canBeValidated(): boolean {
    return this.hasOperations() && !this.isDeleted();
  }

  getOperations(): Operation[] {
    return [...this.operations];
  }

  validateBalance(): void {
    if (!this.hasOperations()) {
      throw new MissingOperationsError();
    }

    if (this.isDeleted()) {
      throw new DeletedEntityOperationError('entry', 'validate');
    }

    const total = this.operations.reduce((sum, operation) => {
      return sum.add(operation.amount);
    }, Amount.create('0'));

    if (!total.isZero()) {
      throw new UnbalancedEntryError(this, total);
    }
  }

  updateDescription(newDescription: string): void {
    this.description = newDescription;
    this.markUpdated();
  }

  static restore({
    createdAt,
    description,
    id,
    isTombstone,
    operations,
    transactionId,
    updatedAt,
    userId,
    version,
  }: EntryWithOperations): Entry {
    const identity = new EntityIdentity(Id.fromPersistence(id));

    const timestamps = EntityTimestamps.fromPersistence(
      Timestamp.restore(updatedAt),
      Timestamp.restore(createdAt),
    );
    const softDelete = SoftDelete.fromPersistence(isTombstone);
    const ownership = ParentChildRelation.create(
      Id.fromPersistence(userId),
      identity.getId(),
    );
    const transactionRelation = ParentChildRelation.create(
      Id.fromPersistence(transactionId),
      identity.getId(),
    );

    const entry = new Entry(
      identity,
      timestamps,
      description,
      softDelete,
      ownership,
      transactionRelation,
      version,
    );

    operations.forEach((operationData) => {
      const operation = Operation.fromPersistence(operationData);
      entry.operations.push(operation);
    });

    return entry;
  }

  removeOperations(): void {
    this.operations = [];
    this.markUpdated();
  }

  updateOperations(operations: Operation[]): void {
    this.validateCanAddOperations(operations);

    this.operations = operations;
    this.markUpdated();
  }

  get createdAt(): IsoDatetimeString {
    return this.timestamps.getCreatedAt().valueOf();
  }

  get updatedAt(): IsoDatetimeString {
    return this.timestamps.getUpdatedAt().valueOf();
  }

  toSnapshot(): EntrySnapshot {
    return {
      createdAt: this.createdAt,
      description: this.description,
      id: this.getId().valueOf(),
      isTombstone: this.isDeleted(),
      operations: this.operations.map((operation) => operation.toSnapshot()),
      transactionId: this.getTransactionId().valueOf(),
      updatedAt: this.updatedAt,
      userId: this.ownership.getParentId().valueOf(),
      version: this.version,
    };
  }
}
