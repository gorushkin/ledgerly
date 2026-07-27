import { AccountCreateDTO, AccountUpdateDTO } from '@ledgerly/shared/types';
import {
  ArchiveAccountUseCase,
  CreateAccountUseCase,
  GetAccountByIdUseCase,
  GetAllAccountsUseCase,
  UpdateAccountUseCase,
} from 'src/application/usecases/accounts';
import { Amount } from 'src/domain/domain-core';
import { Id } from 'src/domain/domain-core/value-objects/Id';
import { User } from 'src/domain/users/user.entity';
import { createUser } from 'src/testing';
import { describe, vi, beforeEach, it, expect } from 'vitest';
import { ZodError } from 'zod';

import { AccountController } from './account.controller';

describe('AccountController', () => {
  let user: User;

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

  const mockArchiveAccountUseCase = {
    execute: vi.fn(),
  };

  const accountController = new AccountController(
    mockGetAccountByIdUseCase as unknown as GetAccountByIdUseCase,
    mockGetAllAccountsUseCase as unknown as GetAllAccountsUseCase,
    mockCreateAccountUseCase as unknown as CreateAccountUseCase,
    mockUpdateAccountUseCase as unknown as UpdateAccountUseCase,
    mockArchiveAccountUseCase as unknown as ArchiveAccountUseCase,
  );

  beforeEach(async () => {
    user = await createUser();

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
      const requestParams = { id: accountId };
      const mockAccount = { id: accountId, name: 'Test Account' };

      mockGetAccountByIdUseCase.execute.mockResolvedValue(mockAccount);

      const result = await accountController.getById(user, requestParams);

      expect(mockGetAccountByIdUseCase.execute).toHaveBeenCalledWith(
        user,
        accountId,
      );
      expect(mockGetAccountByIdUseCase.execute).toHaveBeenCalledTimes(1);
      expect(result).toEqual(mockAccount);
    });

    it('should throw ZodError for invalid request params', async () => {
      await expect(
        accountController.getById(user, { id: 'not-a-uuid' }),
      ).rejects.toThrow(ZodError);

      expect(mockGetAccountByIdUseCase.execute).not.toHaveBeenCalled();
    });
  });

  describe('create', () => {
    it('should call accountService.create with correct data', async () => {
      const requestBody: AccountCreateDTO = {
        commodityId: Id.create().valueOf(),
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
        commodityId: null,
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
      description: 'Test Account',
      name: 'New Account',
      type: 'liability',
    };

    it('should call accountService.update with correct data', async () => {
      await accountController.update(user, { id: accountId }, requestBody);

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
        commodityId: null,
        name: 123,
        type: 'invalid-type',
      };

      await expect(
        accountController.update(user, { id: accountId }, invalidRequestBody),
      ).rejects.toThrow(ZodError);
    });

    it('should throw ZodError for invalid request params', async () => {
      await expect(
        accountController.update(user, { id: 'not-a-uuid' }, requestBody),
      ).rejects.toThrow(ZodError);

      expect(mockUpdateAccountUseCase.execute).not.toHaveBeenCalled();
    });
  });

  describe('archiveAccount', () => {
    it('should call archive account use case with correct account id and user', async () => {
      mockArchiveAccountUseCase.execute.mockResolvedValue(undefined);

      await accountController.archiveAccount(user, { id: accountId });

      expect(mockArchiveAccountUseCase.execute).toHaveBeenCalledWith(
        user,
        accountId,
      );
      expect(mockArchiveAccountUseCase.execute).toHaveBeenCalledTimes(1);
    });

    it('should throw ZodError for invalid request params', async () => {
      await expect(
        accountController.archiveAccount(user, { id: 'not-a-uuid' }),
      ).rejects.toThrow(ZodError);

      expect(mockArchiveAccountUseCase.execute).not.toHaveBeenCalled();
    });
  });
});
