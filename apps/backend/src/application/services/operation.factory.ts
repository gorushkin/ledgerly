import { CurrencyCode, MoneyString, UUID } from '@ledgerly/shared/types';
import { OperationRepoInsert } from 'src/db/schema';
import { Account, Entry, Operation, User } from 'src/domain';
import { Amount } from 'src/domain/domain-core';
import { UnbalancedOperationsError } from 'src/presentation/errors/businessLogic.error';

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
    [fromCurrency, toCurrency]: [CurrencyCode, CurrencyCode],
    systemAccountsMap: Map<CurrencyCode, Account>,
  ): [TradingOperationDTO, TradingOperationDTO] | null {
    // TODO: compare currencies by id, not by string value
    if (fromCurrency === toCurrency) {
      return null;
    }

    const oppositeFromAmount = Amount.create(fromOperationDTO.amount).negate();
    const oppositeToAmount = Amount.create(toOperationDTO.amount).negate();

    const fromSystemAccount = this.getSystemAccountFromMap(
      fromCurrency,
      systemAccountsMap,
    );

    const toSystemAccount = this.getSystemAccountFromMap(
      toCurrency,
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
      throw new UnbalancedOperationsError(
        entry.getId().valueOf(),
        Number(balancedAmount.valueOf()),
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

    const tradingOperationsDTO =
      this.addTradingOperations(
        user,
        entry,
        [fromOperationDTO, toOperationDTO],
        [fromAccount.currency.valueOf(), toAccount.currency.valueOf()],
        currencySystemAccountsMap,
        // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
      ) || [];

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
      Operation.create(user, account, entry, amount, description);

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
