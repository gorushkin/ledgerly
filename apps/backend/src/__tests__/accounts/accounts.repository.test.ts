import {
  AccountCreate,
  AccountResponse,
  UsersResponse,
} from '@ledgerly/shared/types';
import { AccountRepository } from 'src/infrastructure/db/AccountRepository';
import {
  ForeignKeyConstraintError,
  RecordAlreadyExistsError,
} from 'src/presentation/errors';
import { describe, beforeEach, beforeAll, it, expect } from 'vitest';

import { createTestDb } from '../../db/test-db';

const firstUserAccounts = ['firstUserAccount1', 'firstUserAccount2'];
const secondUserAccounts = ['secondUserAccount1', 'secondUserAccount2'];

const accountData: AccountCreate = {
  name: 'Test Account',
  originalCurrency: 'USD',
  type: 'cash',
  userId: 'non-existent-user-id',
};

describe('AccountRepository', () => {
  let testDbInstance: ReturnType<typeof createTestDb>;

  let accountRepository: AccountRepository;
  let user: UsersResponse;

  beforeAll(async () => {
    testDbInstance = createTestDb();
    await testDbInstance.setupTestDb();
    accountRepository = new AccountRepository(testDbInstance.db);
    user = await testDbInstance.createUser();
  });

  beforeEach(async () => {
    await testDbInstance.cleanupTestDb();
    testDbInstance = createTestDb();
    await testDbInstance.setupTestDb();
    accountRepository = new AccountRepository(testDbInstance.db);
    user = await testDbInstance.createUser();
  });

  describe('create', () => {
    it('should create a new account successfully', async () => {
      const newAccount: AccountCreate = {
        name: 'Test Account',
        originalCurrency: 'USD',
        type: 'cash',
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
      const newAccount: AccountCreate = {
        name: 'Unique Account',
        originalCurrency: 'USD',
        type: 'cash',
        userId: user.id,
      };

      // TODO: Replace with direct DB insert to avoid circular dependency in tests
      await accountRepository.create(newAccount);

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

      const secondUser = await testDbInstance.createUser({
        email: 'second-user@example.com',
        name: 'Second User',
      });

      const firstUserAccount: AccountCreate = {
        name: accountName,
        originalCurrency: 'USD',
        type: 'cash',
        userId: user.id,
      };

      const secondUserAccount: AccountCreate = {
        name: accountName,
        originalCurrency: 'EUR',
        type: 'savings',
        userId: secondUser.id,
      };

      // TODO: Replace with direct DB insert to avoid circular dependency in tests
      // Should create test data via testDbInstance.db.insert() instead of accountRepository.create()
      const account1 = await accountRepository.create(firstUserAccount);
      const account2 = await accountRepository.create(secondUserAccount);

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
      const newAccount: AccountCreate = {
        name: 'Test Account',
        originalCurrency: 'XYZ',
        type: 'cash',
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
      const newAccount: AccountCreate = {
        name: 'Test Account',
        originalCurrency: 'USD',
        type: 'cash',
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
  });

  describe('getAll', () => {
    beforeEach(async () => {
      const secondUser = await testDbInstance.createUser({
        email: 'second-user@example.com',
        name: 'Second User',
      });

      for (const name of firstUserAccounts) {
        await testDbInstance.createTestAccount(user.id, {
          name,
          originalCurrency: 'USD',
          type: 'cash',
        });
      }

      for (const name of secondUserAccounts) {
        await testDbInstance.createTestAccount(secondUser.id, {
          name,
          originalCurrency: 'USD',
          type: 'cash',
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
      const secondUser = await testDbInstance.createUser({
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
    let account: AccountResponse;

    beforeEach(async () => {
      account = await testDbInstance.createTestAccount(user.id);
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
      const retrievedAccount = await accountRepository.getById(
        'non-existent-account-id',
        user.id,
      );

      expect(retrievedAccount).toBeUndefined();
    });

    it('should return undefined if user does not own the account', async () => {
      const secondUser = await testDbInstance.createUser({
        email: 'second-user@example.com',
        name: 'Second User',
      });

      const retrievedAccount = await accountRepository.getById(
        account.id,
        secondUser.id,
      );

      expect(retrievedAccount).toBeUndefined();
    });
  });

  describe('update', () => {
    let account: AccountResponse;

    beforeEach(async () => {
      account = await testDbInstance.createTestAccount(user.id);
    });

    it('should update account when it belongs to user', async () => {
      const updatedAccountData: AccountCreate = {
        name: 'Updated Account',
        originalCurrency: 'EUR',
        type: 'savings',
        userId: user.id,
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
      const updatedAccountData: AccountCreate = {
        name: 'Updated Account',
        originalCurrency: 'EUR',
        type: 'savings',
        userId: user.id,
      };

      const updatedAccount = await accountRepository.update(
        'non-existent-account-id',
        account.id,
        updatedAccountData,
      );

      expect(updatedAccount).toBeUndefined();
    });

    it('should not allow updating to duplicate name within same user', async () => {
      const updatedAccountData: AccountCreate = {
        name: 'Updated Account',
        originalCurrency: 'EUR',
        type: 'savings',
        userId: user.id,
      };

      // TODO: Replace with direct DB insert to avoid circular dependency in tests
      // Should create test data via testDbInstance.db.insert() instead of accountRepository.create()
      await accountRepository.create({
        name: updatedAccountData.name,
        originalCurrency: 'USD',
        type: 'cash',
        userId: user.id,
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
      const secondUser = await testDbInstance.createUser({
        email: 'second-user@example.com',
        name: 'Second User',
      });

      // TODO: Replace with direct DB insert to avoid circular dependency in tests
      // Should create test data via testDbInstance.db.insert() instead of accountRepository.create()
      const secondUserAccount = await accountRepository.create({
        name: 'Shared Account Name',
        originalCurrency: 'USD',
        type: 'cash',
        userId: secondUser.id,
      });

      const updatedSecondUserAccount = await accountRepository.update(
        secondUser.id,
        secondUserAccount.id,
        {
          name: accountData.name,
          originalCurrency: 'USD',
          type: 'cash',
          userId: secondUser.id,
        },
      );

      expect(updatedSecondUserAccount).toBeDefined();
      expect(updatedSecondUserAccount?.id).toBe(secondUserAccount.id);
      expect(updatedSecondUserAccount?.name).toBe(accountData.name);
    });

    it('should validate currency when updating', async () => {
      const updatedAccountData: AccountCreate = {
        name: 'Updated Account',
        originalCurrency: 'XYZ', // Non-existent currency
        type: 'savings',
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
  });

  describe('delete', () => {
    let account: AccountResponse;

    beforeEach(async () => {
      account = await testDbInstance.createTestAccount(user.id);
    });

    it('should delete account when it exists and belongs to user', async () => {
      const deleted = await accountRepository.delete(user.id, account.id);

      expect(deleted).toBeUndefined();

      const retrievedAccount = await accountRepository.getById(
        user.id,
        account.id,
      );

      const userAccounts = await accountRepository.getAll(user.id);

      expect(retrievedAccount).toBeUndefined();
      expect(userAccounts.length).toBe(0);
    });

    it('should return undefined when account belongs to different user', async () => {
      const secondUser = await testDbInstance.createUser({
        email: 'second-user@example.com',
        name: 'Second User',
      });

      // TODO: Replace with direct DB insert to avoid circular dependency in tests
      // Should create test data via testDbInstance.db.insert() instead of accountRepository.create()

      await accountRepository.create({
        ...accountData,
        userId: secondUser.id,
      });

      const deleted = await accountRepository.delete(account.id, secondUser.id);

      const secondUserAccounts = await accountRepository.getAll(secondUser.id);

      expect(secondUserAccounts.length).toBe(1);
      expect(deleted).toBeUndefined();
    });

    it('should return undefined when account does not exist', async () => {
      const result = await accountRepository.delete('non-existent-id', user.id);
      expect(result).toBeUndefined();
    });
  });
});
