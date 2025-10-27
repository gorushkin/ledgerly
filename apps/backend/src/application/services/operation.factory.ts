import { OperationRepoInsert } from 'src/db/schema';
import { Account, Entry, Operation, User } from 'src/domain';
import { Amount } from 'src/domain/domain-core';
import { AccountRepository } from 'src/infrastructure/db/accounts/account.repository';

import { CreateOperationRequestDTO, OperationResponseDTO } from '../dto';
import { OperationRepositoryInterface } from '../interfaces';
import { SaveWithIdRetryType } from '../shared/saveWithIdRetry';

export class OperationFactory {
  constructor(
    protected readonly operationRepository: OperationRepositoryInterface,
    protected readonly accountRepository: AccountRepository,
    protected readonly saveWithIdRetry: SaveWithIdRetryType,
  ) {}

  async createOperationsForEntry(
    user: User,
    entry: Entry,
    operations: CreateOperationRequestDTO[],
  ) {
    const createOperations = operations.map(async (opData) => {
      const rawAccount = await this.accountRepository.getById(
        user.getId().valueOf(),
        opData.accountId,
      );

      if (!rawAccount) {
        throw new Error(`Account not found: ${opData.accountId}`);
      }

      const account = Account.restore(rawAccount);

      const createOperation = this.createOperation(
        user,
        account,
        entry,
        opData,
      );

      const operation = createOperation();

      await this.saveOperation(operation, createOperation);

      return operation;
    });

    return await Promise.all(createOperations);
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

  private createOperation(
    user: User,
    account: Account,
    entry: Entry,
    data: CreateOperationRequestDTO,
  ) {
    const amount = Amount.create(data.amount);

    return () =>
      Operation.create(user, account, entry, amount, data.description ?? '');
  }
}
