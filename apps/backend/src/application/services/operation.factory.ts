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

  private async getSystemAccountForCurrency(
    user: User,
    account: Account,
  ): Promise<Account> {
    const currency = account.currency.valueOf();

    const systemAccount = await this.accountRepository.findSystemAccount(
      user.getId().valueOf(),
      currency,
    );

    if (systemAccount) {
      return Account.restore(systemAccount);
    }

    return await this.accountFactory.createAccount(user, {
      currency: currency,
      description: 'System account for internal operations',
      initialBalance: Amount.create('0').valueOf(),
      name: `System Account (${currency})`,
      type: 'currencyTrading',
    });
  }

  private getSystemAccountDescription({
    account,
    amount,
    direction,
  }: {
    account: Account;
    amount: Amount;
    direction: 'from' | 'to';
  }) {
    return `Currency exchange ${direction} ${account.currency.valueOf()} account: ${amount.valueOf()}`;
  }

  private async addTradingOperations(
    user: User,
    [from, to]: CreateEntryRequestDTO,
    fromAccount: Account,
    toAccount: Account,
  ): Promise<CreateEntryRequestDTO | null> {
    if (fromAccount.isCurrencySame(toAccount.currency)) {
      return null;
    }

    const oppositeFrom = Amount.create(from.amount).negate();
    const oppositeTo = Amount.create(to.amount).negate();

    const fromSystemAccount = await this.getSystemAccountForCurrency(
      user,
      fromAccount,
    );

    const toSystemAccount = await this.getSystemAccountForCurrency(
      user,
      toAccount,
    );

    const balancedFromOperationDTO: CreateOperationRequestDTO = {
      accountId: fromSystemAccount.getId().valueOf(),
      amount: oppositeFrom.valueOf(),
      description: this.getSystemAccountDescription({
        account: fromAccount,
        amount: oppositeFrom,
        direction: 'from',
      }),
    };

    const balancedToOperationDTO: CreateOperationRequestDTO = {
      accountId: toSystemAccount.getId().valueOf(),
      amount: oppositeTo.valueOf(),
      description: this.getSystemAccountDescription({
        account: toAccount,
        amount: oppositeTo,
        direction: 'to',
      }),
    };

    return [balancedFromOperationDTO, balancedToOperationDTO];
  }

  validateInputOperationsAmounts({
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
    operations: CreateEntryRequestDTO,
  ) {
    const fromAccount = await this.getOperationAccount(user, operations[0]);
    const toAccount = await this.getOperationAccount(user, operations[1]);

    const tradingOperationsDTO = await this.addTradingOperations(
      user,
      operations,
      fromAccount,
      toAccount,
    );

    const fromOperation = await this.createOperation(
      user,
      entry,
      operations[0],
      fromAccount,
    );

    const toOperation = await this.createOperation(
      user,
      entry,
      operations[1],
      toAccount,
    );

    const systemOperations = tradingOperationsDTO
      ? await Promise.all([
          this.createOperation(
            user,
            entry,
            tradingOperationsDTO[0],
            await this.getOperationAccount(user, tradingOperationsDTO[0]),
          ),
          this.createOperation(
            user,
            entry,
            tradingOperationsDTO[1],
            await this.getOperationAccount(user, tradingOperationsDTO[1]),
          ),
        ])
      : null;

    this.validateInputOperationsAmounts({
      from: fromOperation,
      ...(systemOperations
        ? { system: { from: systemOperations[0], to: systemOperations[1] } }
        : { system: null }),
      to: toOperation,
    });

    return [fromOperation, toOperation, ...(systemOperations ?? [])];
  }

  private async getOperationAccount(
    user: User,
    opData: CreateOperationRequestDTO,
  ) {
    const rawAccount = await this.accountRepository.getById(
      user.getId().valueOf(),
      opData.accountId,
    );

    if (!rawAccount) {
      throw new Error(`Account not found: ${opData.accountId}`);
    }

    return Account.restore(rawAccount);
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
