import { OperationRepository } from 'src/application/interfaces/OperationRepository.interface';
import { describe, it, beforeEach, vi, expect } from 'vitest';

import { GetAccountByIdUseCase } from '../../accounts';
import { UpdateOperationUseCase } from '../updateOperation';

describe('UpdateOperationUseCase', () => {
  let updateOperationUseCase: UpdateOperationUseCase;
  let mockOperationRepository: OperationRepository;
  let mockGetAccountByIdUseCase: GetAccountByIdUseCase;

  beforeEach(() => {
    mockOperationRepository = {
      getById: vi.fn(),
      updateOperation: vi.fn(),
    } as unknown as OperationRepository;

    mockGetAccountByIdUseCase = {
      execute: vi.fn(),
    } as unknown as GetAccountByIdUseCase;

    updateOperationUseCase = new UpdateOperationUseCase(
      mockOperationRepository,
      mockGetAccountByIdUseCase,
    );
  });

  it('should create UpdateOperationUseCase successfully', () => {
    expect(updateOperationUseCase).toBeInstanceOf(UpdateOperationUseCase);
  });

  // TODO: Add more comprehensive tests when business logic is implemented
  it('should have execute method', () => {
    expect(typeof updateOperationUseCase.execute).toBe('function');
  });
});
