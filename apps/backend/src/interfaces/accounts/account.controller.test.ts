import { AccountCreateDTO, AccountUpdateDTO } from '@ledgerly/shared/types';
import {
  DeleteAccountUseCase,
  CreateAccountUseCase,
  GetAccountByIdUseCase,
  GetAllAccountsUseCase,
  UpdateAccountUseCase,
} from 'src/application/usecases/accounts';
import { Amount, Email, Name, Password } from 'src/domain/domain-core';
import { Currency } from 'src/domain/domain-core/value-objects/Currency';
import { Id } from 'src/domain/domain-core/value-objects/Id';
import { User } from 'src/domain/users/user.entity';
import { AccountController } from 'src/interfaces/';
import { describe, vi, beforeEach, it, expect } from 'vitest';
import { ZodError } from 'zod';

describe('AccountController', async () => {
  const userName = Name.create('Ivan');
  const userEmail = Email.create('ivan@example.com');
  const userPassword = await Password.create('securepassword');

  const user = User.create(userName, userEmail, userPassword);

  const accountId = Id.fromPersistence(
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

      const result = await accountController.getAll(user);

      expect(mockGetAllAccountsUseCase.execute).toHaveBeenCalledWith(user);
      expect(mockGetAllAccountsUseCase.execute).toHaveBeenCalledTimes(1);
      expect(result).toEqual(mockAccounts);
    });
  });

  describe('getById', () => {
    it('should call accountService.getById with correct userId and id', async () => {
      const accountId = Id.create().valueOf();
      const mockAccount = { id: accountId, name: 'Test Account' };

      mockGetAccountByIdUseCase.execute.mockResolvedValue(mockAccount);

      const result = await accountController.getById(user, accountId);

      expect(mockGetAccountByIdUseCase.execute).toHaveBeenCalledWith(
        user,
        accountId,
      );
      expect(mockGetAccountByIdUseCase.execute).toHaveBeenCalledTimes(1);
      expect(result).toEqual(mockAccount);
    });
  });

  describe('create', () => {
    it('should call accountService.create with correct data', async () => {
      const requestBody: AccountCreateDTO = {
        currency: Currency.create('USD').valueOf(),
        description: 'Test Account',
        initialBalance: Amount.create('1000').valueOf(),
        name: 'New Account',
        type: 'liability',
      };

      const mockAccountResponse = requestBody;

      mockCreateAccountUseCase.execute.mockResolvedValue(requestBody);

      const result = await accountController.create(user, requestBody);

      expect(mockCreateAccountUseCase.execute).toHaveBeenCalledWith(
        user,
        requestBody,
      );

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
        accountController.create(user, invalidRequestBody),
      ).rejects.toThrow(ZodError);
    });
  });

  describe('update', () => {
    const requestBody: AccountUpdateDTO = {
      currency: Currency.create('USD').valueOf(),
      description: 'Test Account',
      name: 'New Account',
      type: 'liability',
    };

    it('should call accountService.update with correct data', async () => {
      await accountController.update(user, accountId, requestBody);

      const { ...mockAccountResponse } = {
        ...requestBody,
      };

      expect(mockUpdateAccountUseCase.execute).toHaveBeenCalledWith(
        user,
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
        accountController.update(user, accountId, invalidRequestBody),
      ).rejects.toThrow(ZodError);
    });
  });

  describe('delete', () => {
    it('should call accountService.delete with correct id and userId', async () => {
      mockDeleteAccountUseCase.execute.mockResolvedValue(undefined);

      await accountController.deleteAccount(user, accountId);

      expect(mockDeleteAccountUseCase.execute).toHaveBeenCalledWith(
        user,
        accountId,
      );
      expect(mockDeleteAccountUseCase.execute).toHaveBeenCalledTimes(1);
    });
  });
});
