import { OperationRepository } from 'src/application/interfaces/OperationRepository.interface';
import { createUser } from 'src/db/createTestUser';
import { OperationDbRow } from 'src/db/schema';
import { Amount, Timestamp } from 'src/domain/domain-core';
import { Id } from 'src/domain/domain-core/value-objects/Id';
import { Operation } from 'src/domain/operations/operation.entity';
import { DataBase } from 'src/types';
import { describe, it, beforeEach, vi, expect } from 'vitest';

import { GetAccountByIdUseCase } from '../../accounts';
import { CreateOperationUseCase } from '../createOperation';

describe('CreateOperationUseCase', async () => {
  const user = await createUser();

  const entryId = Id.create();
  const accountId = Id.create();

  const amount = '100';
  const description = 'Test operation';
  let createOperationUseCase: CreateOperationUseCase;

  let mockOperationRepository: { create: ReturnType<typeof vi.fn> };
  let mockGetAccountByIdUseCase: { execute: ReturnType<typeof vi.fn> };
  let mockSavedOperationData: OperationDbRow;

  const tx = {} as DataBase;

  beforeEach(() => {
    mockSavedOperationData = {
      accountId: accountId.valueOf(),
      amount: Amount.create(amount).toPersistence(),
      createdAt: Timestamp.create().valueOf(),
      description: 'Test operation',
      entryId: entryId.valueOf(),
      id: Id.create().valueOf(),
      isSystem: false,
      isTombstone: false,
      updatedAt: Timestamp.create().valueOf(),
      userId: user.id,
    };

    mockOperationRepository = {
      create: vi.fn(),
    };

    mockGetAccountByIdUseCase = {
      execute: vi.fn(),
    };

    createOperationUseCase = new CreateOperationUseCase(
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

    const result = await createOperationUseCase.execute(
      user,
      accountId.valueOf(),
      entryId.valueOf(),
      amount,
      description,
      tx,
    );

    expect(spyOperationCreate).toHaveBeenCalledWith(
      Id.fromPersistence(user.id),
      Id.fromPersistence(mockSavedOperationData.id),
      Id.fromPersistence(mockSavedOperationData.entryId),
      Amount.create(amount),
      description,
    );

    expect(spyOperationRepositoryCreate).toHaveBeenCalledWith(
      user.id,
      operationToPersistenceMock,
      tx,
    );

    expect(result).toEqual(mockSavedOperationData);
  });
});
