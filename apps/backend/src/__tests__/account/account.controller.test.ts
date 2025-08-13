import {
  AccountCreateDTO,
  AccountUpdateDTO,
  UUID,
} from '@ledgerly/shared/types';
import { AccountController } from 'src/presentation/controllers/account.controller';
import { AccountService } from 'src/services/account.service';
import { describe, vi, beforeEach, it, expect } from 'vitest';
import { ZodError } from 'zod';

describe('AccountController', () => {
  const mockAccountService = {
    create: vi.fn(),
    delete: vi.fn(),
    getAll: vi.fn(),
    getById: vi.fn(),
    update: vi.fn(),
  };

  const accountController = new AccountController(
    mockAccountService as unknown as AccountService,
  );

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getAll', () => {
    it('should call accountService.getAll with correct userId', async () => {
      const userId = 'test-user-id';
      const mockAccounts = [{ id: '1', name: 'Test Account' }];

      mockAccountService.getAll.mockResolvedValue(mockAccounts);

      const result = await accountController.getAll(userId);

      expect(mockAccountService.getAll).toHaveBeenCalledWith(userId);
      expect(mockAccountService.getAll).toHaveBeenCalledTimes(1);
      expect(result).toEqual(mockAccounts);
    });
  });

  describe('getById', () => {
    it('should call accountService.getById with correct userId and id', async () => {
      const userId = 'test-user-id';
      const accountId = 'test-account-id';
      const mockAccount = { id: accountId, name: 'Test Account' };

      mockAccountService.getById.mockResolvedValue(mockAccount);

      const result = await accountController.getById(userId, accountId);

      expect(mockAccountService.getById).toHaveBeenCalledWith(
        userId,
        accountId,
      );
      expect(mockAccountService.getById).toHaveBeenCalledTimes(1);
      expect(result).toEqual(mockAccount);
    });
  });

  describe('create', () => {
    it('should call accountService.create with correct data', async () => {
      const userId: UUID = 'a2035d76-f6b1-4546-8637-6f034f4ade50';

      const requestBody: AccountCreateDTO = {
        description: 'Test Account',
        initialBalance: 1000,
        name: 'New Account',
        originalCurrency: 'USD',
        type: 'liability',
        userId,
      };

      const mockAccountResponse = { id: userId, ...requestBody };

      mockAccountService.create.mockResolvedValue(mockAccountResponse);

      const result = await accountController.create(userId, requestBody);

      expect(mockAccountService.create).toHaveBeenCalledWith({
        ...requestBody,
        userId,
      });

      expect(mockAccountService.create).toHaveBeenCalledTimes(1);
      expect(result).toEqual(mockAccountResponse);
    });

    it('should handle invalid requestBody gracefully', async () => {
      const userId: UUID = 'a2035d76-f6b1-4546-8637-6f034f4ade50';
      const invalidRequestBody = {
        name: 123,
        originalCurrency: null,
        type: 'invalid-type',
      };

      await expect(
        accountController.create(userId, invalidRequestBody),
      ).rejects.toThrow(ZodError);
    });
  });

  describe('update', () => {
    const userId: UUID = 'a2035d76-f6b1-4546-8637-6f034f4ade50';
    const id = 'b2035d76-f6b1-4546-8637-6f034f4ade50';

    const requestBody: AccountUpdateDTO = {
      description: 'Test Account',
      initialBalance: 1000,
      name: 'New Account',
      originalCurrency: 'USD',
      type: 'liability',
    };

    it('should call accountService.update with correct data', async () => {
      await accountController.update(userId, id, requestBody);

      const { initialBalance, ...mockAccountResponse } = {
        ...requestBody,
      };

      expect(mockAccountService.update).toHaveBeenCalledWith(
        userId,
        id,
        mockAccountResponse,
      );

      expect(mockAccountService.update).toHaveBeenCalledTimes(1);
    });

    it('should handle invalid requestBody gracefully', async () => {
      const invalidRequestBody = {
        name: 123,
        originalCurrency: null,
        type: 'invalid-type',
      };

      await expect(
        accountController.update(userId, id, invalidRequestBody),
      ).rejects.toThrow(ZodError);
    });
  });

  describe('delete', () => {
    it('should call accountService.delete with correct id and userId', async () => {
      const userId: UUID = 'a2035d76-f6b1-4546-8637-6f034f4ade50';
      const accountId: UUID = 'b2035d76-f6b1-4546-8637-6f034f4ade50';

      mockAccountService.delete.mockResolvedValue(undefined);

      await accountController.delete(accountId, userId);

      expect(mockAccountService.delete).toHaveBeenCalledWith(accountId, userId);
      expect(mockAccountService.delete).toHaveBeenCalledTimes(1);
    });
  });
});
