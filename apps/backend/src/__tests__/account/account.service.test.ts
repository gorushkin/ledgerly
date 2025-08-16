import { AccountServiceCreate } from '@ledgerly/shared/types';
import { AccountRepository } from 'src/infrastructure/db/AccountRepository';
import { CurrencyRepository } from 'src/infrastructure/db/CurrencyRepository';
import { NotFoundError } from 'src/presentation/errors/businessLogic.error';
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

  const accountDataInsert: AccountServiceCreate = {
    description: 'Test Description',
    initialBalance: 1000,
    name: 'Test Account',
    originalCurrency: 'USD',
    type: 'liability',
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
      const userId = accountDataInsert.userId;
      await accountService.getAll(userId);

      expect(accountRepository.getAll).toHaveBeenCalledWith(userId);
    });
  });

  describe('create', () => {
    it('should validate currency before creating account', async () => {
      currencyRepository.getById.mockResolvedValue({ code: 'USD' });

      await accountService.create(accountDataInsert);

      expect(currencyRepository.getById).toHaveBeenCalledWith(
        accountDataInsert.originalCurrency,
      );
    });

    it('should call repository create with correct data when currency is valid', async () => {
      currencyRepository.getById.mockResolvedValue({
        code: accountDataInsert.originalCurrency,
      });

      accountRepository.create.mockResolvedValue(accountDataInsert);

      const newAccount = await accountService.create(accountDataInsert);

      expect(accountRepository.create).toHaveBeenCalledWith({
        ...accountDataInsert,
        currentClearedBalanceLocal: accountDataInsert.initialBalance,
        userId: accountDataInsert.userId,
      });

      expect(newAccount).toEqual(accountDataInsert);
    });

    it('should throw error when currency does not exist', async () => {
      currencyRepository.getById.mockResolvedValue(null);

      await expect(accountService.create(accountDataInsert)).rejects.toThrow(
        'Currency with code USD not found',
      );
    });

    it('should fill balance with initialBalance', async () => {
      currencyRepository.getById.mockResolvedValue({
        code: accountDataInsert.originalCurrency,
      });

      accountRepository.create.mockResolvedValue(accountDataInsert);

      await accountService.create(accountDataInsert);

      expect(accountRepository.create).toHaveBeenCalledWith({
        ...accountDataInsert,
        currentClearedBalanceLocal: accountDataInsert.initialBalance,
        userId: accountDataInsert.userId,
      });
    });
  });

  describe('update', () => {
    afterEach(() => {
      vi.clearAllMocks();
      vi.resetAllMocks();
    });

    it('should validate currency and account before updating account', async () => {
      const userId = accountDataInsert.userId;

      currencyRepository.getById.mockResolvedValue({
        code: accountDataInsert.originalCurrency,
      });

      accountRepository.getById.mockResolvedValue({
        userId: accountDataInsert.userId,
      });

      await accountService.update(userId, accountId, accountDataInsert);

      expect(currencyRepository.getById).toHaveBeenCalledWith(
        accountDataInsert.originalCurrency,
      );
    });

    it('should call repository update with correct parameters when currency is valid', async () => {
      const userId = accountDataInsert.userId;

      currencyRepository.getById.mockResolvedValue({
        code: accountDataInsert.originalCurrency,
      });

      accountRepository.getById.mockResolvedValue(accountDataInsert);
      accountRepository.update.mockResolvedValue(accountDataInsert);

      const updatedAccount = await accountService.update(
        userId,
        accountId,
        accountDataInsert,
      );

      expect(currencyRepository.getById).toHaveBeenCalledWith(
        accountDataInsert.originalCurrency,
      );

      expect(accountRepository.update).toHaveBeenCalledWith(
        userId,
        accountId,
        accountDataInsert,
      );

      expect(updatedAccount).toEqual(accountDataInsert);
    });

    it('should throw error when currency does not exist', async () => {
      const userId = accountDataInsert.userId;

      accountRepository.getById.mockResolvedValue({
        userId: accountDataInsert.userId,
      });

      await expect(
        accountService.update(userId, accountId, accountDataInsert),
      ).rejects.toThrow('Currency with code USD not found');
    });
  });

  describe('delete', () => {
    const userId = accountDataInsert.userId;

    it('should call repository delete with correct parameters', async () => {
      currencyRepository.getById.mockResolvedValue({
        code: accountDataInsert.originalCurrency,
      });

      accountRepository.getById.mockResolvedValue({
        userId: accountDataInsert.userId,
      });

      await accountService.delete(userId, accountId);

      expect(accountRepository.delete).toHaveBeenCalledWith(userId, accountId);
    });

    it('should return result from repository', async () => {
      const expectedResult = {
        id: accountId,
        ...accountDataInsert,
        userId: accountDataInsert.userId,
      };

      accountRepository.getById.mockResolvedValue(expectedResult);
      accountRepository.delete.mockResolvedValue(expectedResult);

      const result = await accountService.delete(userId, accountId);

      expect(result).toEqual(expectedResult);
      expect(accountRepository.delete).toHaveBeenCalledWith(userId, accountId);
    });

    it('should throw error when account does not exist', async () => {
      currencyRepository.getById.mockResolvedValue({
        code: accountDataInsert.originalCurrency,
      });

      accountRepository.getById.mockResolvedValue(null);

      await expect(
        accountService.delete(userId, accountId),
      ).rejects.toThrowError(new NotFoundError(`Account not found`));
    });
  });

  describe('getById', () => {
    it('should call the repository method with correct parameters', async () => {
      accountRepository.getById.mockResolvedValue(accountDataInsert);

      await accountService.getById(accountDataInsert.userId, accountId);

      expect(accountRepository.getById).toHaveBeenCalledWith(
        accountDataInsert.userId,
        accountId,
      );
    });

    it('should return account when found', async () => {
      accountRepository.getById.mockResolvedValue(accountDataInsert);

      const result = await accountService.getById(
        accountDataInsert.userId,
        accountId,
      );

      expect(result).toEqual(accountDataInsert);
    });

    it('should throw NotFoundError when account not found', async () => {
      accountRepository.getById.mockResolvedValue(null);

      await expect(
        accountService.getById(accountDataInsert.userId, accountId),
      ).rejects.toThrowError(new NotFoundError(`Account not found`));
    });
  });

  describe('validateAndGetAccount', () => {
    it('should throw error when account does not exist', async () => {
      const userId = accountDataInsert.userId;

      currencyRepository.getById.mockResolvedValue({
        code: accountDataInsert.originalCurrency,
      });

      await expect(
        accountService.update(userId, accountId, accountDataInsert),
      ).rejects.toThrowError(new NotFoundError(`Account not found`));
    });

    it('should throw error when account does not belong to user', async () => {
      const userId = 'another-user-id';

      accountRepository.getById.mockResolvedValue(accountDataInsert);

      currencyRepository.getById.mockResolvedValue({
        code: accountDataInsert.originalCurrency,
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

  describe('validateCurrency', () => {
    it('should throw error when currency does not exist', async () => {
      currencyRepository.getById.mockResolvedValue(null);

      await expect(accountService.create(accountDataInsert)).rejects.toThrow(
        'Currency with code USD not found',
      );
    });

    it('should pass when currency exists', async () => {
      currencyRepository.getById.mockResolvedValue({
        code: accountDataInsert.originalCurrency,
      });

      await expect(
        accountService.validateCurrency(accountDataInsert.originalCurrency),
      ).resolves.not.toThrow();
    });
  });
});
