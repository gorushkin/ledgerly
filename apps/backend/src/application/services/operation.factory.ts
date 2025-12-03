import { CurrencyCode, MoneyString, UUID } from '@ledgerly/shared/types';
import { OperationRepoInsert } from 'src/db/schema';
import { Account, Entry, Operation, User } from 'src/domain';
import { Amount, Currency } from 'src/domain/domain-core';
import { UnbalancedEntryError } from 'src/domain/domain.errors';

import { CreateEntryRequestDTO, OperationResponseDTO } from '../dto';
import { OperationRepositoryInterface } from '../interfaces';
import { SaveWithIdRetryType } from '../shared/saveWithIdRetry';

type TradingOperationDTO = {
  user: User;
  entry: Entry;
  rawAmount: MoneyString;
  description: string;
  account: Account;
};

export class OperationFactory {
  constructor(
    protected readonly operationRepository: OperationRepositoryInterface,
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
    [fromCurrency, toCurrency]: [Currency, Currency],
    systemAccountsMap: Map<CurrencyCode, Account>,
  ): [TradingOperationDTO, TradingOperationDTO] | [] {
    if (fromCurrency.isEqualTo(toCurrency)) {
      return [];
    }

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

    const tradingOperationsDTO = this.addTradingOperations(
      user,
      entry,
      [fromOperationDTO, toOperationDTO],
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

    const operations = await Promise.all(
      dtos.map((opDTO) => {
        return this.createOperation(
          user,
          entry,
          opDTO.rawAmount,
          opDTO.description,
          opDTO.account,
        );
      }),
    );

    return operations;
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
    rawAmount: MoneyString,
    description: string,
    account: Account,
  ) {
    const amount = Amount.create(rawAmount);

    const createOperation = () =>
      Operation.create(user, account.getId(), entry, amount, description);

    return this.saveOperation(createOperation);
  }

  private async saveOperation(createOperation: () => Operation) {
    return this.saveWithIdRetry<
      OperationRepoInsert,
      Operation,
      OperationResponseDTO
    >(
      this.operationRepository.create.bind(this.operationRepository),
      createOperation,
    );
  }
}
