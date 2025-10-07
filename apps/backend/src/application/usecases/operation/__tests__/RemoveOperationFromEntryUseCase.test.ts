import { OperationRepository } from 'src/application/interfaces:toRefactor/OperationRepository.interface';
import { OperationDbRow } from 'src/db/schema';
import { Amount, IsoDatetimeString } from 'src/domain/domain-core';
import { Id } from 'src/domain/domain-core/value-objects/Id';
import { Operation } from 'src/domain/operations/operation.entity';
import { DataBase } from 'src/types';
import { describe, it, beforeEach, vi, expect } from 'vitest';

import { RemoveOperationFromEntryUseCase } from '../RemoveOperationFromEntryUseCase';

describe('DeleteOperationUseCase', () => {
  const userId = Id.create();
  const accountId = Id.create();
  const operationId = Id.create();

  const amount = '100';
  const description = 'Test operation';
  let deleteOperationUseCase: RemoveOperationFromEntryUseCase;

  let mockOperationRepository: {
    getById: ReturnType<typeof vi.fn>;
    update: ReturnType<typeof vi.fn>;
  };

  const tx = {} as DataBase;

  const operationToPersistenceMock = { mock: 'data' };

  const mockOperation = {
    create: vi.fn().mockReturnValue({}),
    delete: vi.fn(),
    fromPersistence: vi.fn(),
    isDeleted: vi.fn().mockReturnValue(false),
    toPersistence: vi.fn().mockReturnValue(operationToPersistenceMock),
  };

  const mockInitialOperationData: OperationDbRow = {
    accountId: accountId.valueOf(),
    amount: Amount.create(amount).toPersistence(),
    createdAt: IsoDatetimeString.create().valueOf(),
    description,
    id: Id.create().valueOf(),
    isSystem: false,
    isTombstone: false,
    updatedAt: IsoDatetimeString.create().valueOf(),
    userId: userId.valueOf(),
  };

  const mockOperationDataDeleted: OperationDbRow = {
    ...mockInitialOperationData,
    isTombstone: true,
  };

  beforeEach(() => {
    mockOperationRepository = {
      getById: vi.fn(),
      update: vi.fn(),
    };

    deleteOperationUseCase = new RemoveOperationFromEntryUseCase(
      mockOperationRepository as unknown as OperationRepository,
    );
  });

  it('should update operation isTombstone successfully', async () => {
    mockOperationRepository.getById.mockResolvedValue(mockInitialOperationData);
    mockOperationRepository.update.mockResolvedValue(mockOperationDataDeleted);

    vi.spyOn(Operation, 'fromPersistence').mockReturnValue(
      mockOperation as unknown as Operation,
    );

    const result = await deleteOperationUseCase.execute(
      userId.valueOf(),
      operationId.valueOf(),
      tx,
    );

    expect(mockOperationRepository.getById).toHaveBeenCalledWith(
      userId.valueOf(),
      operationId.valueOf(),
      tx,
    );

    expect(mockOperationRepository.update).toHaveBeenCalledWith(
      userId.valueOf(),
      operationToPersistenceMock,
      tx,
    );

    expect(mockOperation.isDeleted).toBeCalledTimes(1);
    expect(mockOperation.delete).toBeCalledTimes(1);

    expect(result).toEqual(mockOperationDataDeleted);
  });
});
