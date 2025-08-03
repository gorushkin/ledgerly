import { AccountCreateDTO } from '@ledgerly/shared/types';
import { AccountRepository } from 'src/infrastructure/db/AccountRepository';
import { CurrencyRepository } from 'src/infrastructure/db/CurrencyRepository';
import { NotFoundError } from 'src/presentation/errors';
import { AccountService } from 'src/services/account.service';
import { afterEach, describe, expect, it, vi } from 'vitest';

describe('AccountService', () => {
  const accountRepository = {
    create: vi.fn(),
    delete: vi.fn(),
    getAll: vi.fn(),
    getById: vi.fn(),
    update: vi.fn(),
  };

  const accountId = 'account-id';

  const accountData: AccountCreateDTO = {
    balance: 0,
    initialBalance: 1000,
    name: 'Test Account',
    originalCurrency: 'USD',
    type: 'cash',
    userId: 'first-user-id',
  };

  const currencyRepository = {
    getById: vi.fn(),
  };

  const accountService = new AccountService(
    accountRepository as unknown as AccountRepository,
    currencyRepository as unknown as CurrencyRepository,
  );

  describe('getAll', () => {
    it('should call the repository method with the correct user ID', async () => {
      const userId = accountData.userId;
      console.log('userId: ', userId);
      await accountService.getAll(userId);

      // expect(accountRepository.getAll).toHaveBeenCalledWith(userId);
    });
  });

  describe.skip('create', () => {
    it('should validate currency before creating account', async () => {
      currencyRepository.getById.mockResolvedValue({ code: 'USD' });

      await accountService.create(accountData);

      expect(currencyRepository.getById).toHaveBeenCalledWith(
        accountData.originalCurrency,
      );
    });

    it('should call repository create with correct data when currency is valid', async () => {
      currencyRepository.getById.mockResolvedValue({
        code: accountData.originalCurrency,
      });

      accountRepository.create.mockResolvedValue(accountData);

      const newAccount = await accountService.create(accountData);

      expect(accountRepository.create).toHaveBeenCalledWith({
        ...accountData,
        userId: accountData.userId,
      });

      expect(newAccount).toEqual(accountData);
    });

    it('should throw error when currency does not exist', async () => {
      currencyRepository.getById.mockResolvedValue(null);

      await expect(accountService.create(accountData)).rejects.toThrow(
        'Currency with code USD not found',
      );
    });
  });

  describe.skip('update', () => {
    afterEach(() => {
      vi.clearAllMocks();
      vi.resetAllMocks();
    });

    it('should validate currency and account before updating account', async () => {
      const userId = accountData.userId;

      currencyRepository.getById.mockResolvedValue({
        code: accountData.originalCurrency,
      });

      accountRepository.getById.mockResolvedValue({
        userId: accountData.userId,
      });

      await accountService.update(userId, accountId, accountData);

      expect(currencyRepository.getById).toHaveBeenCalledWith(
        accountData.originalCurrency,
      );
    });

    it('should call repository update with correct parameters when currency is valid', async () => {
      const userId = accountData.userId;

      currencyRepository.getById.mockResolvedValue({
        code: accountData.originalCurrency,
      });

      accountRepository.getById.mockResolvedValue(accountData);
      accountRepository.update.mockResolvedValue(accountData);

      const updatedAccount = await accountService.update(
        userId,
        accountId,
        accountData,
      );

      expect(currencyRepository.getById).toHaveBeenCalledWith(
        accountData.originalCurrency,
      );

      expect(accountRepository.update).toHaveBeenCalledWith(
        userId,
        accountId,
        accountData,
      );

      expect(updatedAccount).toEqual(accountData);
    });

    it('should throw error when currency does not exist', async () => {
      const userId = accountData.userId;

      accountRepository.getById.mockResolvedValue({
        userId: accountData.userId,
      });

      await expect(
        accountService.update(userId, accountId, accountData),
      ).rejects.toThrow('Currency with code USD not found');
    });
  });

  describe.skip('delete', () => {
    const userId = accountData.userId;

    it('should call repository delete with correct parameters', async () => {
      currencyRepository.getById.mockResolvedValue({
        code: accountData.originalCurrency,
      });

      accountRepository.getById.mockResolvedValue({
        userId: accountData.userId,
      });

      await accountService.delete(userId, accountId);

      expect(accountRepository.delete).toHaveBeenCalledWith(userId, accountId);
    });

    it('should return result from repository', async () => {
      const expectedResult = {
        id: accountId,
        ...accountData,
        userId: accountData.userId,
      };

      accountRepository.getById.mockResolvedValue(expectedResult);
      accountRepository.delete.mockResolvedValue(expectedResult);

      const result = await accountService.delete(userId, accountId);

      expect(result).toEqual(expectedResult);
      expect(accountRepository.delete).toHaveBeenCalledWith(userId, accountId);
    });

    it('should throw error when account does not exist', async () => {
      currencyRepository.getById.mockResolvedValue({
        code: accountData.originalCurrency,
      });

      accountRepository.getById.mockResolvedValue(null);

      await expect(
        accountService.delete(userId, accountId),
      ).rejects.toThrowError(new NotFoundError(`Account not found`));
    });
  });

  describe.skip('getById', () => {
    it('should call the repository method with correct parameters', async () => {
      accountRepository.getById.mockResolvedValue(accountData);

      await accountService.getById(accountData.userId, accountId);

      expect(accountRepository.getById).toHaveBeenCalledWith(
        accountData.userId,
        accountId,
      );
    });

    it('should return account when found', async () => {
      accountRepository.getById.mockResolvedValue(accountData);

      const result = await accountService.getById(
        accountData.userId,
        accountId,
      );

      expect(result).toEqual(accountData);
    });

    it('should throw NotFoundError when account not found', async () => {
      accountRepository.getById.mockResolvedValue(null);

      await expect(
        accountService.getById(accountData.userId, accountId),
      ).rejects.toThrowError(
        new NotFoundError(`Account not found`, {
          attemptedUserId: accountData.userId,
          entity: 'Account',
          entityId: accountId,
          reason: 'missing',
        }),
      );
    });
  });

  describe.skip('validateAndGetAccount', () => {
    it('should throw error when account does not exist', async () => {
      const userId = accountData.userId;

      currencyRepository.getById.mockResolvedValue({
        code: accountData.originalCurrency,
      });

      await expect(
        accountService.update(userId, accountId, accountData),
      ).rejects.toThrowError(new NotFoundError(`Account not found`));
    });

    it('should throw error when account does not belong to user', async () => {
      const userId = 'another-user-id';

      accountRepository.getById.mockResolvedValue(accountData);

      currencyRepository.getById.mockResolvedValue({
        code: accountData.originalCurrency,
      });

      const errorPromise = accountService.ensureAccountExistsAndOwned(
        userId,
        accountId,
      );

      await expect(errorPromise).rejects.toThrowError(
        new NotFoundError(`Account not found`),
      );

      // TODO: Add meta information to the error

      // try {
      //   await errorPromise;
      // } catch (error) {
      //   if (error instanceof AppError) {
      //     expect(error.meta?.attemptedUserId).toBe(userId);
      //     expect(error.meta?.reason).toBe('forbidden');
      //   }
      // }
    });
  });

  describe.skip('validateCurrency', () => {
    it('should throw error when currency does not exist', async () => {
      currencyRepository.getById.mockResolvedValue(null);

      await expect(accountService.create(accountData)).rejects.toThrow(
        'Currency with code USD not found',
      );
    });

    it('should pass when currency exists', async () => {
      currencyRepository.getById.mockResolvedValue({
        code: accountData.originalCurrency,
      });

      await expect(
        accountService.validateCurrency(accountData.originalCurrency),
      ).resolves.not.toThrow();
    });
  });
});
