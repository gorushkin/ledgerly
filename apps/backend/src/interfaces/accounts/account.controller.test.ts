import { AccountCreateDTO, AccountUpdateDTO } from '@ledgerly/shared/types';
import {
  DeleteAccountUseCase,
  CreateAccountUseCase,
  GetAccountByIdUseCase,
  GetAllAccountsUseCase,
  UpdateAccountUseCase,
} from 'src/application/usecases/accounts';
import { Id } from 'src/domain/domain-core/value-objects/Id';
import { AccountController } from 'src/interfaces/accounts/account.controller';
import { describe, vi, beforeEach, it, expect } from 'vitest';
import { ZodError } from 'zod';

describe('AccountController', () => {
  const userId = Id.restore('a2035d76-f6b1-4546-8637-6f034f4ade50').valueOf();

  const accountId = Id.restore(
    'b2035d76-f6b1-4546-8637-6f034f4ade50',
  ).valueOf();

  const mockGetAccountByIdUseCase = {
    execute: vi.fn(),
  };

  const mockGetAllAccountsUseCase = {
    execute: vi.fn(),
  };

  const mockCreateAccountUseCase = {
    execute: vi.fn(),
  };

  const mockUpdateAccountUseCase = {
    execute: vi.fn(),
  };

  const mockDeleteAccountUseCase = {
    execute: vi.fn(),
  };

  const accountController = new AccountController(
    mockGetAccountByIdUseCase as unknown as GetAccountByIdUseCase,
    mockGetAllAccountsUseCase as unknown as GetAllAccountsUseCase,
    mockCreateAccountUseCase as unknown as CreateAccountUseCase,
    mockUpdateAccountUseCase as unknown as UpdateAccountUseCase,
    mockDeleteAccountUseCase as unknown as DeleteAccountUseCase,
  );

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getAll', () => {
    it('should call accountService.getAll with correct userId', async () => {
      const mockAccounts = [{ id: '1', name: 'Test Account' }];

      mockGetAllAccountsUseCase.execute.mockResolvedValue(mockAccounts);

      const result = await accountController.getAll(userId);

      expect(mockGetAllAccountsUseCase.execute).toHaveBeenCalledWith(userId);
      expect(mockGetAllAccountsUseCase.execute).toHaveBeenCalledTimes(1);
      expect(result).toEqual(mockAccounts);
    });
  });

  describe('getById', () => {
    it('should call accountService.getById with correct userId and id', async () => {
      const accountId = Id.create().valueOf();
      const mockAccount = { id: accountId, name: 'Test Account' };

      mockGetAccountByIdUseCase.execute.mockResolvedValue(mockAccount);

      const result = await accountController.getById(userId, accountId);

      expect(mockGetAccountByIdUseCase.execute).toHaveBeenCalledWith(
        userId,
        accountId,
      );
      expect(mockGetAccountByIdUseCase.execute).toHaveBeenCalledTimes(1);
      expect(result).toEqual(mockAccount);
    });
  });

  describe('create', () => {
    it('should call accountService.create with correct data', async () => {
      const requestBody: AccountCreateDTO = {
        currency: 'USD',
        description: 'Test Account',
        initialBalance: '1000',
        name: 'New Account',
        type: 'liability',
        userId,
      };

      const mockAccountResponse = requestBody;

      mockCreateAccountUseCase.execute.mockResolvedValue(requestBody);

      const result = await accountController.create(userId, requestBody);

      expect(mockCreateAccountUseCase.execute).toHaveBeenCalledWith(userId, {
        ...requestBody,
        userId,
      });

      expect(mockCreateAccountUseCase.execute).toHaveBeenCalledTimes(1);
      expect(result).toEqual(mockAccountResponse);
    });

    it('should handle invalid requestBody gracefully', async () => {
      const invalidRequestBody = {
        currency: null,
        name: 123,
        type: 'invalid-type',
      };

      await expect(
        accountController.create(userId, invalidRequestBody),
      ).rejects.toThrow(ZodError);
    });
  });

  describe('update', () => {
    const requestBody: AccountUpdateDTO = {
      currency: 'USD',
      description: 'Test Account',
      name: 'New Account',
      type: 'liability',
    };

    it('should call accountService.update with correct data', async () => {
      await accountController.update(userId, accountId, requestBody);

      const { ...mockAccountResponse } = {
        ...requestBody,
      };

      expect(mockUpdateAccountUseCase.execute).toHaveBeenCalledWith(
        userId,
        accountId,
        mockAccountResponse,
      );

      expect(mockUpdateAccountUseCase.execute).toHaveBeenCalledTimes(1);
    });

    it('should handle invalid requestBody gracefully', async () => {
      const invalidRequestBody = {
        name: 123,
        originalCurrency: null,
        type: 'invalid-type',
      };

      await expect(
        accountController.update(userId, accountId, invalidRequestBody),
      ).rejects.toThrow(ZodError);
    });
  });

  describe('delete', () => {
    it('should call accountService.delete with correct id and userId', async () => {
      mockDeleteAccountUseCase.execute.mockResolvedValue(undefined);

      await accountController.deleteAccount(accountId, userId);

      expect(mockDeleteAccountUseCase.execute).toHaveBeenCalledWith(
        accountId,
        userId,
      );
      expect(mockDeleteAccountUseCase.execute).toHaveBeenCalledTimes(1);
    });
  });
});
