import { CurrencyCode, UUID } from '@ledgerly/shared/types';
import { OperationRepoInsert } from 'src/db/schema';
import { Account, Entry, Operation, User } from 'src/domain';
import { Amount } from 'src/domain/domain-core';

import {
  CreateOperationRequestDTO,
  CreateEntryRequestDTO,
  OperationResponseDTO,
} from '../dto';
import {
  AccountRepositoryInterface,
  OperationRepositoryInterface,
} from '../interfaces';
import { SaveWithIdRetryType } from '../shared/saveWithIdRetry';

import { AccountFactory } from './account.factory';

export class OperationFactory {
  constructor(
    protected readonly operationRepository: OperationRepositoryInterface,
    protected readonly accountFactory: AccountFactory,
    protected readonly accountRepository: AccountRepositoryInterface,
    protected readonly saveWithIdRetry: SaveWithIdRetryType,
  ) {}

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
    [fromOperationDTO, toOperationDTO]: CreateEntryRequestDTO,
    [fromCurrency, toCurrency]: [CurrencyCode, CurrencyCode],
    systemAccountsMap: Map<CurrencyCode, Account>,
  ): [Operation, Operation] | null {
    // TODO: compare currencies by id, not by string value
    if (fromCurrency === toCurrency) {
      return null;
    }

    const oppositeFrom = Amount.create(fromOperationDTO.amount).negate();
    const oppositeTo = Amount.create(toOperationDTO.amount).negate();

    const fromSystemAccount = this.getSystemAccountFromMap(
      fromCurrency,
      systemAccountsMap,
    );

    const toSystemAccount = this.getSystemAccountFromMap(
      toCurrency,
      systemAccountsMap,
    );

    const balancedFromOperation = Operation.create(
      user,
      fromSystemAccount,
      entry,
      oppositeFrom,
      this.getSystemAccountDescription({
        amount: oppositeFrom,
        currency: fromCurrency,
        direction: 'from',
      }),
    );

    const balancedToOperation = Operation.create(
      user,
      toSystemAccount,
      entry,
      oppositeTo,
      this.getSystemAccountDescription({
        amount: oppositeTo,
        currency: toCurrency,
        direction: 'to',
      }),
    );

    return [balancedFromOperation, balancedToOperation];
  }

  private validateInputOperationsAmounts({
    from,
    system,
    to,
  }: {
    from: Operation;
    to: Operation;
    system: { from: Operation; to: Operation } | null;
  }) {
    if (!system) {
      const balance = from.amount.add(to.amount);

      if (!balance.isZero()) {
        throw new Error(
          `Operations amounts are not balanced: from=${from.amount.valueOf()}, to=${to.amount.valueOf()}`,
        );
      }
      return;
    }

    const balance = [
      from.amount,
      system.from.amount,
      system.to.amount,
      to.amount,
    ].reduce((balance, amount) => {
      return balance.add(amount);
    }, Amount.create('0'));

    if (!balance.isZero()) {
      throw new Error(
        `Operations amounts are not balanced: (including system operations)from=${from.amount.valueOf()}, to=${to.amount.valueOf()}`,
      );
    }
  }

  async createOperationsForEntry(
    user: User,
    entry: Entry,
    [fromOperationDTO, toOperationDTO]: CreateEntryRequestDTO,
    accountsByIdMap: Map<UUID, Account>,
    currencySystemAccountsMap: Map<CurrencyCode, Account>,
  ) {
    const fromAccount = this.getAccountFromMap(
      fromOperationDTO.accountId,
      accountsByIdMap,
    );

    const toAccount = this.getAccountFromMap(
      toOperationDTO.accountId,
      accountsByIdMap,
    );

    const tradingOperations = this.addTradingOperations(
      user,
      entry,
      [fromOperationDTO, toOperationDTO],
      [fromAccount.currency.valueOf(), toAccount.currency.valueOf()],
      currencySystemAccountsMap,
    );

    const fromOperation = await this.createOperation(
      user,
      entry,
      fromOperationDTO,
      fromAccount,
    );

    const toOperation = await this.createOperation(
      user,
      entry,
      toOperationDTO,
      toAccount,
    );

    this.validateInputOperationsAmounts({
      from: fromOperation,
      ...(tradingOperations
        ? { system: { from: tradingOperations[0], to: tradingOperations[1] } }
        : { system: null }),
      to: toOperation,
    });

    return [fromOperation, toOperation, ...(tradingOperations ?? [])];
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

  private async createOperation(
    user: User,
    entry: Entry,
    opData: CreateOperationRequestDTO,
    account: Account,
  ) {
    const amount = Amount.create(opData.amount);

    const createOperation = () =>
      Operation.create(user, account, entry, amount, opData.description);

    const operation = createOperation();

    await this.saveOperation(operation, createOperation);

    return operation;
  }

  private async saveOperation(
    entry: Operation,
    createOperation: () => Operation,
  ) {
    const result = await this.saveWithIdRetry<
      OperationRepoInsert,
      Operation,
      OperationResponseDTO
    >(
      entry,
      this.operationRepository.create.bind(this.operationRepository),
      createOperation,
    );

    return result;
  }
}
