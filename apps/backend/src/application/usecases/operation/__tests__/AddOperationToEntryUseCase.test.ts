import { OperationRepository } from 'src/application/interfaces:toRefactor/OperationRepository.interface';
import { OperationDbRow } from 'src/db/schema';
import { Amount, IsoDatetimeString } from 'src/domain/domain-core';
import { Id } from 'src/domain/domain-core/value-objects/Id';
import { Operation } from 'src/domain/operations/operation.entity';
import { DataBase } from 'src/types';
import { describe, it, beforeEach, vi, expect } from 'vitest';

import { GetAccountByIdUseCase } from '../../accounts';
import { AddOperationToEntryUseCase } from '../AddOperationToEntryUseCase';

describe('AddOperationToEntryUseCase', () => {
  const userId = Id.create();
  const entryId = Id.create();
  const accountId = Id.create();

  const amount = '100';
  const description = 'Test operation';
  let addOperationToEntryUseCase: AddOperationToEntryUseCase;

  let mockOperationRepository: { create: ReturnType<typeof vi.fn> };
  let mockGetAccountByIdUseCase: { execute: ReturnType<typeof vi.fn> };

  const tx = {} as DataBase;

  const mockSavedOperationData: OperationDbRow = {
    accountId: accountId.valueOf(),
    amount: Amount.create(amount).toPersistence(),
    createdAt: IsoDatetimeString.create().valueOf(),
    description: 'Test operation',
    entryId: entryId.valueOf(),
    id: Id.create().valueOf(),
    isSystem: false,
    isTombstone: false,
    updatedAt: IsoDatetimeString.create().valueOf(),
    userId: userId.valueOf(),
  };

  beforeEach(() => {
    mockOperationRepository = {
      create: vi.fn(),
    };

    mockGetAccountByIdUseCase = {
      execute: vi.fn(),
    };

    addOperationToEntryUseCase = new AddOperationToEntryUseCase(
      mockOperationRepository as unknown as OperationRepository,
      mockGetAccountByIdUseCase as unknown as GetAccountByIdUseCase,
    );
  });

  it('should add operation to entry successfully', async () => {
    mockGetAccountByIdUseCase.execute.mockResolvedValue(mockSavedOperationData);

    const operationToPersistenceMock = { mock: 'data' };

    const mockOperation = {
      create: vi.fn().mockReturnValue({}),
      toPersistence: vi.fn().mockReturnValue(operationToPersistenceMock),
    };

    const spyOperationCreate = vi
      .spyOn(Operation, 'create')
      .mockReturnValue(mockOperation as unknown as Operation);

    const spyOperationRepositoryCreate = vi
      .spyOn(mockOperationRepository, 'create')
      .mockReturnValue(mockSavedOperationData as unknown as Operation);

    const result = await addOperationToEntryUseCase.execute(
      userId.valueOf(),
      accountId.valueOf(),
      entryId.valueOf(),
      amount,
      description,
      tx,
    );

    expect(spyOperationCreate).toHaveBeenCalledWith(
      Id.fromPersistence(userId.valueOf()),
      Id.fromPersistence(mockSavedOperationData.id),
      Id.fromPersistence(mockSavedOperationData.entryId),
      Amount.create(amount),
      description,
    );

    expect(spyOperationRepositoryCreate).toHaveBeenCalledWith(
      userId.valueOf(),
      operationToPersistenceMock,
      tx,
    );

    expect(result).toEqual(mockSavedOperationData);
  });
});
