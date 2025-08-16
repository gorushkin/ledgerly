import {
  AccountDbRow,
  AccountDbInsert,
  UsersResponseDTO,
  CurrencyCode,
} from '@ledgerly/shared/types';
import dayjs from 'dayjs';
import { AccountRepository } from 'src/infrastructure/db/AccountRepository';
import {
  ForeignKeyConstraintError,
  RecordAlreadyExistsError,
} from 'src/presentation/errors';
import { NotFoundError } from 'src/presentation/errors/businessLogic.error';
import { describe, beforeEach, it, expect, vi } from 'vitest';

import { TestDB } from '../../db/test-db';

const firstUserAccounts = ['firstUserAccount1', 'firstUserAccount2'];
const secondUserAccounts = ['secondUserAccount1', 'secondUserAccount2'];

const USD: CurrencyCode = 'USD' as CurrencyCode;

const accountData: AccountDbInsert = {
  currentClearedBalanceLocal: 0,
  description: 'This is a test account',
  initialBalance: 1000,
  name: 'Test Account',
  originalCurrency: USD,
  type: 'asset',
  userId: 'non-existent-user-id',
};

describe('AccountRepository', () => {
  let testDB: TestDB;

  let accountRepository: AccountRepository;
  let user: UsersResponseDTO;

  beforeEach(async () => {
    testDB = new TestDB();
    await testDB.setupTestDb();
    accountRepository = new AccountRepository(testDB.db);
    user = await testDB.createUser();
  });

  describe('create', () => {
    it('should create a new account successfully', async () => {
      const newAccount: AccountDbInsert = {
        currentClearedBalanceLocal: 0,
        initialBalance: 100,
        name: 'Test Account',
        originalCurrency: USD,
        type: 'asset',
        userId: user.id,
      };

      const account = await accountRepository.create({
        ...newAccount,
      });

      expect(account).toHaveProperty('id');
      expect(account.name).toBe(newAccount.name);
      expect(account.originalCurrency).toBe(newAccount.originalCurrency);
      expect(account.type).toBe(newAccount.type);
      expect(account.userId).toBe(newAccount.userId);
    });

    it('should not allow duplicate account names for the same user', async () => {
      const newAccount: AccountDbInsert = {
        currentClearedBalanceLocal: 0,
        description: 'This is a unique account',
        initialBalance: 100,
        name: 'Unique Account',
        originalCurrency: USD,
        type: 'asset',
        userId: user.id,
      };

      await testDB.createAccount(user.id, {
        ...newAccount,
      });

      await expect(accountRepository.create(newAccount)).rejects.toThrowError(
        new RecordAlreadyExistsError({
          context: {
            field: 'accountName',
            tableName: 'accounts',
            value: newAccount.name,
          },
        }),
      );
    });

    it('should allow same account names for different users', async () => {
      const accountName = 'Shared Account Name';

      const secondUser = await testDB.createUser({
        email: 'second-user@example.com',
        name: 'Second User',
      });

      const firstUserAccount: AccountDbInsert = {
        currentClearedBalanceLocal: 0,
        description: 'This is a test account',
        initialBalance: 1000,
        name: accountName,
        originalCurrency: USD,
        type: 'asset',
        userId: user.id,
      };

      const secondUserAccount: AccountDbInsert = {
        currentClearedBalanceLocal: 0,
        description: 'This is a test account for second user',
        initialBalance: 1000,
        name: accountName,
        originalCurrency: 'EUR',
        type: 'expense',
        userId: secondUser.id,
      };

      const account1 = await testDB.createAccount(user.id, {
        ...firstUserAccount,
      });
      const account2 = await testDB.createAccount(secondUser.id, {
        ...secondUserAccount,
      });

      expect(account1).toHaveProperty('id');
      expect(account1.name).toBe(accountName);
      expect(account1.userId).toBe(user.id);

      expect(account2).toHaveProperty('id');
      expect(account2.name).toBe(accountName);
      expect(account2.userId).toBe(secondUser.id);

      expect(account1.id).not.toBe(account2.id);
      expect(account1.userId).not.toBe(account2.userId);
    });

    it('should throw an error if the original currency does not exist', async () => {
      const newAccount: AccountDbInsert = {
        currentClearedBalanceLocal: 0,
        description: 'This is a test account',
        initialBalance: 100,
        name: 'Test Account',
        originalCurrency: 'XYZ',
        type: 'asset',
        userId: user.id,
      };

      await expect(accountRepository.create(newAccount)).rejects.toThrowError(
        new ForeignKeyConstraintError({
          context: {
            field: 'code',
            tableName: 'currencies',
            value: newAccount.originalCurrency,
          },
        }),
      );
    });

    it('should throw an error if the user does not exist', async () => {
      const newAccount: AccountDbInsert = {
        currentClearedBalanceLocal: 0,
        description: 'This is a test account',
        initialBalance: 100,
        name: 'Test Account',
        originalCurrency: USD,
        type: 'asset',
        userId: 'non-existent-user-id',
      };

      await expect(accountRepository.create(newAccount)).rejects.toThrowError(
        new ForeignKeyConstraintError({
          context: {
            field: 'id',
            tableName: 'users',
            value: newAccount.userId,
          },
        }),
      );
    });

    it('should handle UUID collision gracefully', async () => {
      const uuid = crypto.randomUUID();
      vi.spyOn(globalThis.crypto, 'randomUUID')
        .mockReturnValueOnce(uuid) // первая попытка → коллизия
        .mockReturnValueOnce(uuid); // ретрай → успех

      const accountDto: AccountDbInsert = {
        currentClearedBalanceLocal: 0,
        description: 'This is a test account',
        initialBalance: 100,
        name: 'Test Account',
        originalCurrency: USD,
        type: 'asset',
        userId: user.id,
      };

      const account1 = await accountRepository.create({
        ...accountDto,
      });

      const account2 = await accountRepository.create({
        ...accountDto,
        name: 'Test Account 2',
      });

      expect(account2).toHaveProperty('id');
      expect(account2.name).toBe('Test Account 2');
      expect(account2.originalCurrency).toBe(accountDto.originalCurrency);
      expect(account2.type).toBe(accountDto.type);
      expect(account2.userId).toBe(accountDto.userId);

      expect(account1.id).not.toBe(account2.id);
      expect(account1.userId).toBe(user.id);
      expect(account2.userId).toBe(user.id);
    });
  });

  describe('getAll', () => {
    beforeEach(async () => {
      const secondUser = await testDB.createUser({
        email: 'second-user@example.com',
        name: 'Second User',
      });

      for (const name of firstUserAccounts) {
        await testDB.createAccount(user.id, {
          name,
          originalCurrency: USD,
          type: 'asset',
        });
      }

      for (const name of secondUserAccounts) {
        await testDB.createAccount(secondUser.id, {
          name,
          originalCurrency: USD,
          type: 'asset',
        });
      }
    });

    it('should retrieve all accounts for a user', async () => {
      const accounts = await accountRepository.getAll(user.id);

      expect(accounts.length).toBe(firstUserAccounts.length);

      accounts.forEach((account, index) => {
        expect(account.name).toBe(firstUserAccounts[index]);
        expect(account.userId).toBe(user.id);
      });
    });

    it('should not retrieve accounts for a different user', async () => {
      const secondUser = await testDB.createUser({
        email: 'second-user2@example.com',
        name: 'Second User',
      });

      const accounts = await accountRepository.getAll(secondUser.id);

      expect(accounts.length).toBe(0);
    });

    it('should return an empty array if user does not exist', async () => {
      const accounts = await accountRepository.getAll('non-existent-user-id');

      expect(accounts.length).toBe(0);
    });
  });

  describe('getById', () => {
    let account: AccountDbRow;

    beforeEach(async () => {
      account = await testDB.createAccount(user.id);
    });

    it('should retrieve an account by ID', async () => {
      const retrievedAccount = await accountRepository.getById(
        user.id,
        account.id,
      );

      expect(retrievedAccount).toBeDefined();
      expect(retrievedAccount?.id).toBe(account.id);
    });

    it('should return undefined if account does not exist', async () => {
      const retrievedAccount = accountRepository.getById(
        'non-existent-account-id',
        user.id,
      );

      await expect(retrievedAccount).rejects.toThrowError(NotFoundError);
    });

    it('should return undefined if user does not own the account', async () => {
      const secondUser = await testDB.createUser({
        email: 'second-user@example.com',
        name: 'Second User',
      });

      const retrievedAccount = accountRepository.getById(
        account.id,
        secondUser.id,
      );

      await expect(retrievedAccount).rejects.toThrowError(NotFoundError);
    });
  });

  describe('update', () => {
    let account: AccountDbRow;

    beforeEach(async () => {
      account = await testDB.createAccount(user.id);
    });

    it('should update account when it belongs to user', async () => {
      const user2 = await testDB.createUser();

      const updatedAccountData: AccountDbInsert = {
        currentClearedBalanceLocal: 0,
        description: 'Updated description',
        initialBalance: 2000,
        name: 'Updated Account',
        originalCurrency: 'EUR',
        type: 'expense',
        userId: user2.id,
      };

      const updatedAccount = await accountRepository.update(
        user.id,
        account.id,
        updatedAccountData,
      );

      expect(updatedAccount).toBeDefined();
      expect(updatedAccount?.id).toBe(account.id);
      expect(updatedAccount?.name).toBe(updatedAccountData.name);
      expect(updatedAccount?.originalCurrency).toBe(
        updatedAccountData.originalCurrency,
      );
      expect(updatedAccount?.type).toBe(updatedAccountData.type);
      expect(updatedAccount?.userId).toBe(user.id);
    });

    it('should return undefined when account belongs to different user', async () => {
      const updatedAccountData: AccountDbInsert = {
        currentClearedBalanceLocal: 0,
        description: 'This is a test account',
        initialBalance: 2000,
        name: 'Updated Account',
        originalCurrency: 'EUR',
        type: 'expense',
        userId: user.id,
      };

      const updatedAccount = accountRepository.update(
        'non-existent-account-id',
        account.id,
        updatedAccountData,
      );

      await expect(updatedAccount).rejects.toThrowError(NotFoundError);
    });

    it('should not allow updating to duplicate name within same user', async () => {
      const updatedAccountData: AccountDbInsert = {
        currentClearedBalanceLocal: 0,
        description: 'This is a test account',
        initialBalance: 2000,
        name: 'Updated Account',
        originalCurrency: 'EUR',
        type: 'expense',
        userId: user.id,
      };

      await testDB.createAccount(user.id, {
        initialBalance: 2000,
        name: updatedAccountData.name,
        originalCurrency: USD,
        type: 'asset',
      });

      await expect(
        accountRepository.update(user.id, account.id, updatedAccountData),
      ).rejects.toThrowError(
        new RecordAlreadyExistsError({
          context: {
            field: 'accountName',
            tableName: 'accounts',
            value: updatedAccountData.name,
          },
        }),
      );
    });

    it('should allow updating to name that exists for different user', async () => {
      const secondUser = await testDB.createUser({
        email: 'second-user@example.com',
        name: 'Second User',
      });

      const secondUserAccount = await testDB.createAccount(secondUser.id, {
        initialBalance: 2000,
        name: 'Shared Account Name',
        originalCurrency: USD,
        type: 'asset',
      });

      const updatedSecondUserAccount = await accountRepository.update(
        secondUser.id,
        secondUserAccount.id,
        {
          name: accountData.name,
          originalCurrency: USD,
          type: 'asset',
        },
      );

      expect(updatedSecondUserAccount).toBeDefined();
      expect(updatedSecondUserAccount?.id).toBe(secondUserAccount.id);
      expect(updatedSecondUserAccount?.name).toBe(accountData.name);
    });

    it('should validate currency when updating', async () => {
      const updatedAccountData: AccountDbInsert = {
        currentClearedBalanceLocal: 0,
        description: ' This is a test account',
        initialBalance: 2000,
        name: 'Updated Account',
        originalCurrency: 'XYZ',
        type: 'expense',
        userId: user.id,
      };

      await expect(
        accountRepository.update(user.id, account.id, updatedAccountData),
      ).rejects.toThrowError(
        new ForeignKeyConstraintError({
          context: {
            field: 'code',
            tableName: 'currencies',
            value: updatedAccountData.originalCurrency,
          },
        }),
      );
    });

    it('should only update allowed fields', async () => {
      const maliciousData = {
        createdAt: new Date().toISOString(),
        id: 'malicious-id',
        initialBalance: 2000,
        name: 'Updated Account',
        originalCurrency: 'EUR',
        type: 'expense' as const,
        updatedAt: new Date().toISOString(),
      };

      const result = await accountRepository.update(
        user.id,
        account.id,
        maliciousData,
      );

      expect(result?.id).toBe(account.id);
      expect(result?.userId).toBe(user.id);
      expect(result?.name).toBe(maliciousData.name);
      expect(result?.originalCurrency).toBe(maliciousData.originalCurrency);
    });
  });

  describe('delete', () => {
    let account: AccountDbRow;

    beforeEach(async () => {
      account = await testDB.createAccount(user.id);
    });

    it('should delete account when it exists and belongs to user', async () => {
      const deleted = await accountRepository.delete(user.id, account.id);

      expect(deleted).toBeUndefined();

      const retrievedAccount = accountRepository.getById(user.id, account.id);

      const userAccounts = await accountRepository.getAll(user.id);

      await expect(retrievedAccount).rejects.toThrowError(NotFoundError);

      expect(userAccounts.length).toBe(0);
    });

    it('should return undefined when account belongs to different user', async () => {
      const secondUser = await testDB.createUser({
        email: 'second-user@example.com',
        name: 'Second User',
      });

      await testDB.createAccount(secondUser.id, {
        initialBalance: 2000,
        name: 'Shared Account Name',
        originalCurrency: USD,
        type: 'asset',
      });

      const deleted = accountRepository.delete(account.id, secondUser.id);
      await expect(deleted).rejects.toThrowError(NotFoundError);

      const secondUserAccounts = await accountRepository.getAll(secondUser.id);

      expect(secondUserAccounts.length).toBe(1);
    });

    it('should return undefined when account does not exist', async () => {
      const result = accountRepository.delete('non-existent-id', user.id);
      await expect(result).rejects.toThrowError(NotFoundError);
    });
  });

  describe('timestamp behavior', () => {
    it('should set createdAt and updatedAt on creation', async () => {
      const beforeCreate = dayjs();

      const newAccount: AccountDbInsert = {
        currentClearedBalanceLocal: 0,
        description: 'This is a test account',
        initialBalance: 1000,
        name: 'Timestamp Test Account',
        originalCurrency: USD,
        type: 'asset',
        userId: user.id,
      };

      const account = await accountRepository.create(newAccount);
      const accountDate = dayjs(account.createdAt);

      const afterCreate = dayjs();

      expect(account.createdAt).toBeDefined();
      expect(account.updatedAt).toBeDefined();
      expect(dayjs(account.createdAt)).toBeInstanceOf(dayjs);
      expect(dayjs(account.updatedAt)).toBeInstanceOf(dayjs);

      expect(beforeCreate.unix()).toBeLessThanOrEqual(accountDate.unix());
      expect(accountDate.unix()).toBeLessThanOrEqual(afterCreate.unix());
    });

    it('should update updatedAt on account update', async () => {
      const account = await testDB.createAccount(user.id);
      const originalUpdatedAt = dayjs(account?.updatedAt);

      await new Promise((resolve) => setTimeout(resolve, 1000));

      const updatedData: AccountDbInsert = {
        currentClearedBalanceLocal: 0,
        description: 'This is a test account',
        initialBalance: 2000,
        name: 'Updated Timestamp Account',
        originalCurrency: 'EUR',
        type: 'expense',
        userId: user.id,
      };

      const updatedAccount = await accountRepository.update(
        user.id,
        account.id,
        updatedData,
      );

      const newUpdatedAt = dayjs(updatedAccount?.updatedAt);

      expect(updatedAccount?.updatedAt).not.toBe(originalUpdatedAt);
      expect(originalUpdatedAt.unix()).toBeLessThanOrEqual(newUpdatedAt.unix());
    });
  });
});
