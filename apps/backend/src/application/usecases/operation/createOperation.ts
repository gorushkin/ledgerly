import { UUID } from '@ledgerly/shared/types';
import type { OperationRepository } from 'src/application/interfaces/OperationRepository.interface';
import { OperationDbRow } from 'src/db/schema';
import { Amount, Id } from 'src/domain/domain-core';
import { Operation } from 'src/domain/operations/operation.entity';
import { User } from 'src/domain/users/user.entity';
import { DataBase } from 'src/types';

import { GetAccountByIdUseCase } from '../accounts';

export class CreateOperationUseCase {
  constructor(
    private readonly operationRepository: OperationRepository,
    private readonly getAccountByIdUseCase: GetAccountByIdUseCase,
  ) {}

  async execute(
    user: User,
    accountId: UUID,
    entryId: UUID,
    amount: string,
    description: string,
    tx: DataBase,
  ): Promise<OperationDbRow> {
    const account = await this.getAccountByIdUseCase.execute(user, accountId);

    const operation = Operation.create(
      Id.fromPersistence(user.id),
      Id.fromPersistence(account.id),
      Id.fromPersistence(entryId),
      Amount.create(amount),
      description,
    );

    const createdOperation = await this.operationRepository.create(
      user.id,
      operation.toPersistence(),
      tx,
    );

    return createdOperation;
  }
}
