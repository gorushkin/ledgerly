import { CurrencyCode, Money } from '@ledgerly/shared/types';
import { Id } from 'src/domain/domain-core/value-objects/Id';
import { AccountRepository } from 'src/infrastructure/db/accounts/account.repository';
import { UsersRepository } from 'src/infrastructure/db/UsersRepository';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { GetAccountByIdUseCase } from '../getAccountById';

describe('GetAccountByIdUseCase', () => {
  let getAccountByIdUseCase: GetAccountByIdUseCase;
  let mockAccountRepository: {
    create: ReturnType<typeof vi.fn>;
    getById: ReturnType<typeof vi.fn>;
  };
  let mockUserRepository: { getUserById: ReturnType<typeof vi.fn> };

  const userId = Id.fromPersistence(
    '550e8400-e29b-41d4-a716-446655440000',
  ).valueOf();
  const accountId = Id.fromPersistence(
    '550e8400-e29b-41d4-a716-446655440001',
  ).valueOf();
  const accountName = 'Test Account';
  const description = 'Test account description';
  const initialBalance = 1000 as Money;
  const currency = 'USD' as CurrencyCode;
  const accountType = 'asset';

  const mockUser = {
    createdAt: new Date().toISOString(),
    email: 'test@example.com',
    id: userId,
    name: 'Test User',
  };

  const mockSavedAccountData = {
    createdAt: new Date().toISOString(),
    currency,
    currentClearedBalanceLocal: initialBalance,
    description,
    id: '550e8400-e29b-41d4-a716-446655440001',
    initialBalance,
    name: accountName,
    type: accountType,
    updatedAt: new Date().toISOString(),
    userId,
  };

  beforeEach(() => {
    mockAccountRepository = {
      create: vi.fn(),
      getById: vi.fn(),
    };

    mockUserRepository = {
      getUserById: vi.fn(),
    };

    getAccountByIdUseCase = new GetAccountByIdUseCase(
      mockAccountRepository as unknown as AccountRepository,
      mockUserRepository as unknown as UsersRepository,
    );
  });

  describe('execute', () => {
    it('should return the account when it exists and is owned by the user', async () => {
      mockUserRepository.getUserById.mockResolvedValue(mockUser);
      mockAccountRepository.getById.mockResolvedValue(mockSavedAccountData);

      await getAccountByIdUseCase.execute(userId, accountId);

      expect(mockUserRepository.getUserById).toHaveBeenCalledWith(
        userId,
        undefined,
      );
      expect(mockAccountRepository.getById).toHaveBeenCalledWith(
        userId,
        accountId,
      );
    });

    // TODO: Add missing tests based on account.service.test.ts:
    // - should throw error when user does not exist
    // - should throw error when account does not exist
    // - should throw error when account does not belong to user
    // - should return the correct account data
    // - should handle repository errors properly
  });
});
