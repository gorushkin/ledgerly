import { apiErrorCodes, AccountTypeValue, UUID } from '@ledgerly/shared/types';
import dayjs from 'dayjs';
import {
  AccountDbInsert,
  AccountDbRow,
  CommodityDbRow,
  UserDbRow,
} from 'src/db/schema';
import { Amount, CommodityCode, Timestamp } from 'src/domain/domain-core';
import { Id } from 'src/domain/domain-core/value-objects/Id';
import { AccountRepository } from 'src/infrastructure/db/';
import {
  RecordAlreadyExistsError,
  RepositoryNotFoundError,
} from 'src/infrastructure/errors';
import { describe, beforeEach, it, expect, vi } from 'vitest';

import { TestDB } from '../../../db/test-db';
import { TransactionManager } from '../TransactionManager';

const firstUserAccounts = ['firstUserAccount1', 'firstUserAccount2'];
const secondUserAccounts = ['secondUserAccount1', 'secondUserAccount2'];

const getAccountData = (params: {
  userId: UUID;
  commodityId: UUID;
  name: string;
  type: AccountTypeValue;
}): AccountDbInsert => {
  return {
    commodityId: params.commodityId,
    currentClearedBalanceLocal: Amount.create('0').valueOf(),
    description: 'This is a test account',
    initialBalance: Amount.create('100').valueOf(),
    isSystem: false,
    isTombstone: false,
    name: params.name,
    type: params.type,
    userId: params.userId,
    ...TestDB.uuid,
    ...TestDB.createTimestamps,
  };
};

const accountDataRaw = {
  commodityId: 'non-existent-commodity-id' as UUID,
  name: 'Test Account',
  type: 'asset' as const,
  userId: 'non-existent-user-id' as UUID,
};

const accountData = getAccountData(accountDataRaw);

describe('AccountRepository', () => {
  let testDB: TestDB;

  const transactionManager = {
    getCurrentTransaction: () => testDB.db,
    run: vi.fn((cb: () => unknown) => {
      return cb();
    }),
  };

  const accountRepository = new AccountRepository(
    transactionManager as unknown as TransactionManager,
  );

  let user: UserDbRow;
  let usdCommodity: CommodityDbRow;
  let eurCommodity: CommodityDbRow;

  beforeEach(async () => {
    testDB = new TestDB();
    await testDB.setupTestDb();

    user = await testDB.createUser();

    usdCommodity = await testDB.createCommodity(user.id, {
      code: CommodityCode.create('USD').valueOf(),
    });

    eurCommodity = await testDB.createCommodity(user.id, {
      code: CommodityCode.create('EUR').valueOf(),
    });
  });

  describe('create', () => {
    it('should create a new account successfully', async () => {
      const newAccount = getAccountData({
        commodityId: usdCommodity.id,
        name: 'New Account',
        type: 'asset',
        userId: user.id,
      });

      const account = await accountRepository.create({
        ...newAccount,
      });

      expect(account).toHaveProperty('id');
      expect(account.name).toBe(newAccount.name);
      expect(account.type).toBe(newAccount.type);
      expect(account.userId).toBe(newAccount.userId);
    });

    it("should throw an error if commodity belongs to a different user than the account's user", async () => {
      const secondUser = await testDB.createUser({
        email: 'second-user@example.com',
        name: 'Second User',
      });

      const newAccount = getAccountData({
        commodityId: usdCommodity.id,
        name: 'New Account',
        type: 'asset',
        userId: secondUser.id,
      });

      await expect(accountRepository.create(newAccount)).rejects.toThrowError(
        RepositoryNotFoundError,
      );
    });

    it('should not allow duplicate account names for the same user', async () => {
      const newAccount = getAccountData({
        commodityId: usdCommodity.id,
        name: 'New Account',
        type: 'asset',
        userId: user.id,
      });

      await testDB.createAccount(user.id, usdCommodity.id, newAccount);

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

      const firstUserAccount = getAccountData({
        commodityId: usdCommodity.id,
        name: accountName,
        type: 'asset',
        userId: user.id,
      });

      const secondUserAccount = getAccountData({
        commodityId: usdCommodity.id,
        name: accountName,
        type: 'asset',
        userId: secondUser.id,
      });

      const account1 = await testDB.createAccount(user.id, usdCommodity.id, {
        ...firstUserAccount,
      });
      const account2 = await testDB.createAccount(
        secondUser.id,
        usdCommodity.id,
        {
          ...secondUserAccount,
        },
      );

      expect(account1).toHaveProperty('id');
      expect(account1.name).toBe(accountName);
      expect(account1.userId).toBe(user.id);

      expect(account2).toHaveProperty('id');
      expect(account2.name).toBe(accountName);
      expect(account2.userId).toBe(secondUser.id);

      expect(account1.id).not.toBe(account2.id);
      expect(account1.userId).not.toBe(account2.userId);
    });

    it('should throw an error if commodity is tombstoned', async () => {
      const tombstonedCommodity = await testDB.createCommodity(user.id, {
        code: CommodityCode.create('TOMBSTONED').valueOf(),
        isTombstone: true,
        name: 'Tombstoned Commodity',
        precision: 2,
        symbol: 'T',
      });

      const newAccount = getAccountData({
        commodityId: tombstonedCommodity.id,
        name: 'New Account with Tombstoned Commodity',
        type: 'asset',
        userId: user.id,
      });

      await expect(accountRepository.create(newAccount)).rejects.toThrowError(
        RepositoryNotFoundError,
      );
    });
  });

  describe('getAll', () => {
    beforeEach(async () => {
      const secondUser = await testDB.createUser({
        email: 'second-user@example.com',
        name: 'Second User',
      });

      for (const name of firstUserAccounts) {
        await testDB.createAccount(user.id, usdCommodity.id, {
          name,
          type: 'asset',
        });
      }

      for (const name of secondUserAccounts) {
        await testDB.createAccount(secondUser.id, usdCommodity.id, {
          name,
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
      const accounts = await accountRepository.getAll(Id.create().valueOf());

      expect(accounts.length).toBe(0);
    });
  });

  describe('getById', () => {
    let account: AccountDbRow;

    beforeEach(async () => {
      account = await testDB.createAccount(user.id, usdCommodity.id, {});
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
        Id.create().valueOf(),
        user.id,
      );

      await expect(retrievedAccount).rejects.toThrowError(
        RepositoryNotFoundError,
      );
    });

    it('returns an allowlisted error contract for a missing account', async () => {
      const accountId = Id.create().valueOf();

      await expect(
        accountRepository.getById(user.id, accountId),
      ).rejects.toMatchObject({
        code: apiErrorCodes.entityNotFound,
        context: { entityId: accountId, entityType: 'account' },
      });
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

      await expect(retrievedAccount).rejects.toThrowError(
        RepositoryNotFoundError,
      );
    });
  });

  describe('update', () => {
    let account: AccountDbRow;

    beforeEach(async () => {
      account = await testDB.createAccount(user.id, usdCommodity.id, {});
    });

    it('should update account when it belongs to user', async () => {
      const user2 = await testDB.createUser();

      const updatedAccountData = getAccountData({
        commodityId: eurCommodity.id,
        name: 'Updated Account',
        type: 'expense',
        userId: user2.id,
      });

      const updatedAccount = await accountRepository.update(
        user.id,
        account.id,
        updatedAccountData,
      );

      expect(updatedAccount).toBeDefined();
      expect(updatedAccount?.id).toBe(account.id);
      expect(updatedAccount?.name).toBe(updatedAccountData.name);
      expect(updatedAccount?.type).toBe(updatedAccountData.type);
      expect(updatedAccount?.userId).toBe(user.id);
    });

    it('should return undefined when account belongs to different user', async () => {
      const updatedAccountData = getAccountData({
        commodityId: eurCommodity.id,
        name: 'Updated Account',
        type: 'expense',
        userId: user.id,
      });

      const updatedAccount = accountRepository.update(
        Id.create().valueOf(),
        account.id,
        updatedAccountData,
      );

      await expect(updatedAccount).rejects.toThrowError(
        RepositoryNotFoundError,
      );
    });

    it('should not allow updating to duplicate name within same user', async () => {
      const updatedAccountData = getAccountData({
        commodityId: usdCommodity.id,
        name: 'Updated Account',
        type: 'asset',
        userId: user.id,
      });

      await testDB.createAccount(user.id, usdCommodity.id, {
        initialBalance: Amount.create('200').valueOf(),
        name: updatedAccountData.name,
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

      const secondUserAccount = await testDB.createAccount(
        secondUser.id,
        usdCommodity.id,
        {
          initialBalance: Amount.create('200').valueOf(),
          name: 'Shared Account Name',
          type: 'asset',
        },
      );

      const updatedSecondUserAccount = await accountRepository.update(
        secondUser.id,
        secondUserAccount.id,
        {
          name: accountData.name,
          type: 'asset',
          updatedAt: Timestamp.create().valueOf(),
        },
      );

      expect(updatedSecondUserAccount).toBeDefined();
      expect(updatedSecondUserAccount?.id).toBe(secondUserAccount.id);
      expect(updatedSecondUserAccount?.name).toBe(accountData.name);
    });

    it.todo('should preserve commodityId when updating account fields');

    it('should only update allowed fields', async () => {
      const maliciousData = {
        createdAt: Timestamp.create().valueOf(),
        id: 'malicious-id',
        initialBalance: Amount.create('2000').valueOf(),
        name: 'Updated Account',
        type: 'expense' as const,
        updatedAt: Timestamp.create().valueOf(),
      };

      const result = await accountRepository.update(
        user.id,
        account.id,
        maliciousData,
      );

      expect(result?.id).toBe(account.id);
      expect(result?.userId).toBe(user.id);
      expect(result?.name).toBe(maliciousData.name);
    });
  });

  describe('delete', () => {
    let account: AccountDbRow;

    beforeEach(async () => {
      account = await testDB.createAccount(user.id, usdCommodity.id);
    });

    it('should delete account when it exists and belongs to user', async () => {
      const deletedData = {
        isTombstone: true,
        updatedAt: Timestamp.restore('2030-01-01T00:00:00.000Z').valueOf(),
      };

      const deleted = await accountRepository.delete(
        user.id,
        account.id,
        deletedData,
      );

      expect(deleted).toBeDefined();
      expect(deleted.isTombstone).toBe(true);
      expect(deleted.updatedAt).toBe(deletedData.updatedAt);
      expect(deleted.updatedAt).not.toBe(account.updatedAt);

      const retrievedAccount = accountRepository.getById(user.id, account.id);

      const userAccounts = await accountRepository.getAll(user.id);

      await expect(retrievedAccount).rejects.toThrowError(
        RepositoryNotFoundError,
      );

      expect(userAccounts.length).toBe(0);
    });

    it('should throw RepositoryNotFoundError when account belongs to different user', async () => {
      const secondUser = await testDB.createUser({
        email: 'second-user@example.com',
        name: 'Second User',
      });

      await testDB.createAccount(secondUser.id, usdCommodity.id, {
        initialBalance: Amount.create('2000').valueOf(),
        name: 'Shared Account Name',
        type: 'asset',
      });

      await expect(
        accountRepository.delete(secondUser.id, account.id, {
          updatedAt: Timestamp.create().valueOf(),
        }),
      ).rejects.toThrowError(RepositoryNotFoundError);

      const secondUserAccounts = await accountRepository.getAll(secondUser.id);

      expect(secondUserAccounts.length).toBe(1);
    });

    it('should throw RepositoryNotFoundError when account does not exist', async () => {
      const result = accountRepository.delete(user.id, Id.create().valueOf(), {
        updatedAt: Timestamp.create().valueOf(),
      });

      await expect(result).rejects.toThrowError(RepositoryNotFoundError);
    });
  });

  describe('timestamp behavior', () => {
    it('should set createdAt and updatedAt on creation', async () => {
      const beforeCreate = dayjs();

      const newAccount = getAccountData({
        commodityId: usdCommodity.id,
        name: 'This is a test account',
        type: 'asset',
        userId: user.id,
      });
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
      const account = await testDB.createAccount(user.id, usdCommodity.id);
      const originalUpdatedAt = dayjs(account?.updatedAt);

      await new Promise((resolve) => setTimeout(resolve, 1000));

      const updatedData = getAccountData({
        commodityId: eurCommodity.id,
        name: 'Updated Account',
        type: 'expense',
        userId: user.id,
      });

      const updatedAccount = await accountRepository.update(
        user.id,
        account.id,
        updatedData,
      );

      const newUpdatedAt = dayjs(updatedAccount?.updatedAt);

      expect(updatedAccount?.updatedAt).toBe(updatedData.updatedAt);
      expect(updatedAccount?.updatedAt).not.toBe(account.updatedAt);
      expect(originalUpdatedAt.unix()).toBeLessThanOrEqual(newUpdatedAt.unix());
    });
  });
});
