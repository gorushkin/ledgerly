import { UUID } from '@ledgerly/shared/types';
import type { OperationRepository } from 'src/application/interfaces:toRefactor/OperationRepository.interface';
import { OperationDbRow } from 'src/db/schema';
import { Amount, Id } from 'src/domain/domain-core';
import { Operation } from 'src/domain/operations/operation.entity';
import { DataBase } from 'src/types';

import { GetAccountByIdUseCase } from '../accounts';

export class AddOperationToEntryUseCase {
  constructor(
    private readonly operationRepository: OperationRepository,
    private readonly getAccountByIdUseCase: GetAccountByIdUseCase,
  ) {}

  async execute(
    userId: UUID,
    accountId: UUID,
    amount: string,
    description: string,
    tx: DataBase,
  ): Promise<OperationDbRow> {
    const account = await this.getAccountByIdUseCase.execute(userId, accountId);

    const operation = Operation.create(
      Id.restore(userId),
      Id.restore(account.id),
      Amount.create(amount),
      description,
    );

    const createdOperation = await this.operationRepository.create(
      userId,
      operation.toPersistence(),
      tx,
    );

    return createdOperation;
  }
}
