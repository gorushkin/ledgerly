import { AccountTypeValue, UUID } from '@ledgerly/shared/types';
import { AccountQuery } from '@ledgerly/shared/validation';
import dayjs from 'dayjs';
import { eq } from 'drizzle-orm';
import {
  AccountDbInsert,
  AccountDbRow,
  CommodityDbRow,
  UserDbRow,
  accountsTable,
} from 'src/db/schema';
import {
  compareEntities,
  compareEntityArrays,
} from 'src/db/test-utils/entityComparer';
import { CommodityCode, Timestamp } from 'src/domain/domain-core';
import { Id } from 'src/domain/domain-core/value-objects/Id';
import { AccountRepository } from 'src/infrastructure/db/';
import {
  AccountPersistenceConflictError,
  ForbiddenAccessError,
  ForeignKeyConstraintError,
  RecordAlreadyExistsError,
  RepositoryInvariantError,
  RepositoryNotFoundError,
} from 'src/infrastructure/errors';
import { describe, beforeEach, it, expect, vi } from 'vitest';

import { TestDB } from '../../../db/test-db';
import { TransactionManager } from '../TransactionManager';

const getAccountData = (params: {
  userId: UUID;
  commodityId: UUID;
  name: string;
  type: AccountTypeValue;
}): AccountDbInsert => {
  return {
    commodityId: params.commodityId,
    description: 'This is a test account',
    isClosed: false,
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
    it('creates an account', async () => {
      const newAccount = getAccountData({
        commodityId: usdCommodity.id,
        name: 'New Account',
        type: 'asset',
        userId: user.id,
      });

      await accountRepository.create(user.id, {
        ...newAccount,
      });

      const retrievedAccount = await testDB.getAccountById(newAccount.id);

      if (!retrievedAccount) {
        throw new Error('Account not found after creation');
      }

      expect(retrievedAccount).toHaveProperty('id');
      expect(retrievedAccount.name).toBe(newAccount.name);
      expect(retrievedAccount.type).toBe(newAccount.type);
      expect(retrievedAccount.userId).toBe(newAccount.userId);
    });

    it("throws ForeignKeyConstraintError when commodity belongs to a different user than the account's user", async () => {
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

      await expect(
        accountRepository.create(secondUser.id, newAccount),
      ).rejects.toThrowError(ForeignKeyConstraintError);
    });

    it('throws RepositoryInvariantError when create userId differs from account snapshot userId', async () => {
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

      await expect(
        accountRepository.create(user.id, newAccount),
      ).rejects.toThrowError(RepositoryInvariantError);
    });

    it('throws RecordAlreadyExistsError for duplicate account names owned by the same user', async () => {
      const newAccount = getAccountData({
        commodityId: usdCommodity.id,
        name: 'New Account',
        type: 'asset',
        userId: user.id,
      });

      await testDB.createAccount(user.id, usdCommodity.id, newAccount);

      await expect(
        accountRepository.create(user.id, newAccount),
      ).rejects.toThrowError(
        new RecordAlreadyExistsError({
          context: {
            field: 'accountName',
            tableName: 'accounts',
            value: newAccount.name,
          },
        }),
      );
    });

    it('allows duplicate account names across different users', async () => {
      const accountName = 'Shared Account Name';

      const secondUser = await testDB.createUser({
        email: 'second-user@example.com',
        name: 'Second User',
      });
      const secondUserCommodity = await testDB.createCommodity(secondUser.id, {
        code: CommodityCode.create('USD').valueOf(),
      });

      const firstUserAccount = getAccountData({
        commodityId: usdCommodity.id,
        name: accountName,
        type: 'asset',
        userId: user.id,
      });

      const secondUserAccount = getAccountData({
        commodityId: secondUserCommodity.id,
        name: accountName,
        type: 'asset',
        userId: secondUser.id,
      });

      const retrievedAccount1 = await testDB.createAccount(
        user.id,
        usdCommodity.id,
        {
          ...firstUserAccount,
        },
      );

      const retrievedAccount2 = await testDB.createAccount(
        secondUser.id,
        secondUserCommodity.id,
        {
          ...secondUserAccount,
        },
      );

      expect(retrievedAccount1).toHaveProperty('id');
      expect(retrievedAccount1.name).toBe(accountName);
      expect(retrievedAccount1.userId).toBe(user.id);

      expect(retrievedAccount2).toHaveProperty('id');
      expect(retrievedAccount2.name).toBe(accountName);
      expect(retrievedAccount2.userId).toBe(secondUser.id);

      expect(retrievedAccount1.id).not.toBe(retrievedAccount2.id);
      expect(retrievedAccount1.userId).not.toBe(retrievedAccount2.userId);
    });

    it('allows creating an account with a tombstoned commodity at persistence boundary', async () => {
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

      await accountRepository.create(user.id, newAccount);

      const createdAccount = await accountRepository.getById(
        user.id,
        newAccount.id,
      );

      expect(createdAccount).toMatchObject({
        commodityId: tombstonedCommodity.id,
        id: newAccount.id,
      });
    });

    it('allows creating an account with a closed commodity at persistence boundary', async () => {
      const closedCommodity = await testDB.createCommodity(user.id, {
        code: CommodityCode.create('CLOSED').valueOf(),
        isClosed: true,
        name: 'Closed Commodity',
        precision: 2,
        symbol: 'C',
      });

      const newAccount = getAccountData({
        commodityId: closedCommodity.id,
        name: 'New Account with Closed Commodity',
        type: 'asset',
        userId: user.id,
      });

      await accountRepository.create(user.id, newAccount);

      const createdAccount = await accountRepository.getById(
        user.id,
        newAccount.id,
      );

      expect(createdAccount).toMatchObject({
        commodityId: closedCommodity.id,
        id: newAccount.id,
      });
    });

    it('throws AccountPersistenceConflictError when insert affects no rows', async () => {
      const newAccount = getAccountData({
        commodityId: usdCommodity.id,
        name: 'New Account',
        type: 'asset',
        userId: user.id,
      });

      const values = vi.fn().mockResolvedValue({ rowsAffected: 0 });

      const insert = vi
        .spyOn(testDB.db, 'insert')
        .mockReturnValueOnce({ values } as never);

      try {
        await expect(
          accountRepository.create(user.id, newAccount),
        ).rejects.toThrowError(AccountPersistenceConflictError);

        expect(insert).toHaveBeenCalledOnce();
        expect(values).toHaveBeenCalledWith(
          expect.objectContaining({
            id: newAccount.id,
            name: newAccount.name,
            userId: newAccount.userId,
          }),
        );
      } finally {
        insert.mockRestore();
      }
    });
  });

  describe('getAll', () => {
    const accountsDataList = [
      { isClosed: false, isTombstone: true, name: 'firstUserAccount1' },
      { isClosed: false, isTombstone: false, name: 'firstUserAccount2' },
      { isClosed: true, isTombstone: false, name: 'firstUserAccount3' },
    ];

    const allAccounts = accountsDataList.filter(
      (account) => !account.isTombstone,
    );

    const activeAccounts = accountsDataList.filter(
      (account) => !account.isClosed && !account.isTombstone,
    );

    const closedAccounts = accountsDataList.filter(
      (account) => account.isClosed && !account.isTombstone,
    );

    type TestData = {
      isClosed: boolean;
      isTombstone: boolean;
      name: string;
    };

    const testData: [AccountQuery, TestData[]][] = [
      [{ status: 'all' }, allAccounts],
      [{ status: 'open' }, activeAccounts],
      [{ status: 'closed' }, closedAccounts],
    ];

    beforeEach(async () => {
      for (const data of accountsDataList) {
        await testDB.createAccount(user.id, usdCommodity.id, {
          isClosed: data.isClosed,
          isTombstone: data.isTombstone,
          name: data.name,
          type: 'asset',
        });
      }
    });

    it.each(testData)(
      'returns accounts matching query %s',
      async ({ status }: AccountQuery, expectedAccounts: TestData[]) => {
        const accounts = await accountRepository.getAll(user.id, {
          status,
        });

        compareEntityArrays(accounts, expectedAccounts, {
          fields: ['name', 'isClosed', 'isTombstone'],
        });

        expect(accounts.length).toBe(expectedAccounts.length);
      },
    );

    it('returns an empty array when user does not exist', async () => {
      const accounts = await accountRepository.getAll(Id.create().valueOf(), {
        status: 'all',
      });

      expect(accounts.length).toBe(0);
    });

    it('returns an empty array when user has no accounts', async () => {
      const newUser = await testDB.createUser({
        email: 'new-user@example.com',
        name: 'New User',
      });

      const accounts = await accountRepository.getAll(newUser.id, {
        status: 'all',
      });
      expect(accounts.length).toBe(0);
    });

    it('should not include accounts owned by another user', async () => {
      const secondUser = await testDB.createUser({
        email: 'second-user@example.com',
        name: 'Second User',
      });
      const secondUserCommodity = await testDB.createCommodity(secondUser.id, {
        code: CommodityCode.create('USD').valueOf(),
      });

      const accountsForSecondUser = [
        { isClosed: false, isTombstone: false, name: 'secondUserAccount1' },
        { isClosed: false, isTombstone: false, name: 'secondUserAccount2' },
        { isClosed: false, isTombstone: false, name: 'secondUserAccount3' },
      ];

      await Promise.all(
        accountsForSecondUser.map((account) =>
          testDB.createAccount(secondUser.id, secondUserCommodity.id, {
            isClosed: account.isClosed,
            isTombstone: account.isTombstone,
            name: account.name,
            type: 'asset',
          }),
        ),
      );

      const accounts = await accountRepository.getAll(secondUser.id, {
        status: 'all',
      });

      expect(
        accounts.every((account) => account.userId === secondUser.id),
      ).toBe(true);
    });
  });

  describe('getById', () => {
    let activeAccountRow: AccountDbRow;

    beforeEach(async () => {
      activeAccountRow = await testDB.createAccount(
        user.id,
        usdCommodity.id,
        {},
      );
    });

    it('retrieves an active account by id', async () => {
      const retrievedAccount = await accountRepository.getById(
        user.id,
        activeAccountRow.id,
      );

      expect(retrievedAccount).toBeDefined();
      expect(retrievedAccount?.id).toBe(activeAccountRow.id);
    });

    it('throws RepositoryNotFoundError when account does not exist', async () => {
      const retrievedAccount = accountRepository.getById(
        user.id,
        Id.create().valueOf(),
      );

      await expect(retrievedAccount).rejects.toThrowError(
        RepositoryNotFoundError,
      );
    });

    it('throws RepositoryNotFoundError when account is tombstoned', async () => {
      const tombstonedAccountRow = await testDB.createAccount(
        user.id,
        usdCommodity.id,
        { isTombstone: true },
      );
      const retrievedAccount = accountRepository.getById(
        user.id,
        tombstonedAccountRow.id,
      );

      await expect(retrievedAccount).rejects.toThrowError(
        RepositoryNotFoundError,
      );
    });

    it('throws RepositoryNotFoundError when user does not own the account', async () => {
      const secondUser = await testDB.createUser({
        email: 'second-user@example.com',
        name: 'Second User',
      });

      const retrievedAccount = accountRepository.getById(
        secondUser.id,
        activeAccountRow.id,
      );

      await expect(retrievedAccount).rejects.toThrowError(
        RepositoryNotFoundError,
      );
    });
  });

  describe('getByIdForLifecycle', () => {
    it('should retrieve an active account by id', async () => {
      const activeAccountRow = await testDB.createAccount(
        user.id,
        usdCommodity.id,
        {},
      );

      const retrievedAccount = await accountRepository.getByIdForLifecycle(
        user.id,
        activeAccountRow.id,
      );

      compareEntities(retrievedAccount, activeAccountRow);
    });

    it('should retrieve a tombstoned account by id', async () => {
      const tombstonedAccountRow = await testDB.createAccount(
        user.id,
        usdCommodity.id,
        { isTombstone: true },
      );

      const retrievedAccount = await accountRepository.getByIdForLifecycle(
        user.id,
        tombstonedAccountRow.id,
      );

      expect(tombstonedAccountRow.isTombstone).toBe(true);

      compareEntities(retrievedAccount, tombstonedAccountRow);
    });

    it('should throw RepositoryNotFoundError when account does not exist', async () => {
      const retrievedAccount = accountRepository.getByIdForLifecycle(
        user.id,
        Id.create().valueOf(),
      );

      await expect(retrievedAccount).rejects.toThrowError(
        RepositoryNotFoundError,
      );
    });

    it('should throw RepositoryNotFoundError when user does not own the account', async () => {
      const secondUser = await testDB.createUser({
        email: 'second-user@example.com',
        name: 'Second User',
      });

      const retrievedAccount = accountRepository.getByIdForLifecycle(
        secondUser.id,
        Id.create().valueOf(),
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

    it('updates an account owned by the user', async () => {
      const user2 = await testDB.createUser();

      const updatedAccountData = getAccountData({
        commodityId: eurCommodity.id,
        name: 'Updated Account',
        type: 'expense',
        userId: user2.id,
      });

      await accountRepository.update(user.id, account.id, updatedAccountData);

      const retrievedAccount = await testDB.getAccountById(account.id);

      expect(retrievedAccount).toBeDefined();
      expect(retrievedAccount?.id).toBe(account.id);
      expect(retrievedAccount?.name).toBe(updatedAccountData.name);
      expect(retrievedAccount?.type).toBe(updatedAccountData.type);
      expect(retrievedAccount?.userId).toBe(user.id);
    });

    it('throws RepositoryNotFoundError when account belongs to another user', async () => {
      const updatedAccountData = getAccountData({
        commodityId: eurCommodity.id,
        name: 'Updated Account',
        type: 'expense',
        userId: user.id,
      });

      const promise = accountRepository.update(
        Id.create().valueOf(),
        account.id,
        updatedAccountData,
      );

      await expect(promise).rejects.toThrowError(RepositoryNotFoundError);
    });

    it('throws RecordAlreadyExistsError when updating to a duplicate name owned by the same user', async () => {
      const updatedAccountData = getAccountData({
        commodityId: usdCommodity.id,
        name: 'Updated Account',
        type: 'asset',
        userId: user.id,
      });

      await testDB.createAccount(user.id, usdCommodity.id, {
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

      const retrievedAccount = await testDB.getAccountById(account.id);

      expect(retrievedAccount).toBeDefined();
      expect(retrievedAccount?.id).toBe(account.id);
      expect(retrievedAccount?.name).not.toBe(updatedAccountData.name);
    });

    it('allows updating to a name used by another user', async () => {
      const secondUser = await testDB.createUser({
        email: 'second-user@example.com',
        name: 'Second User',
      });
      const secondUserCommodity = await testDB.createCommodity(secondUser.id, {
        code: CommodityCode.create('USD').valueOf(),
      });

      const secondUserAccount = await testDB.createAccount(
        secondUser.id,
        secondUserCommodity.id,
        {
          name: 'Shared Account Name',
          type: 'asset',
        },
      );

      await accountRepository.update(secondUser.id, secondUserAccount.id, {
        name: accountData.name,
        type: 'asset',
        updatedAt: Timestamp.create().valueOf(),
      });

      const retrievedAccount = await testDB.getAccountById(
        secondUserAccount.id,
      );

      expect(retrievedAccount).toBeDefined();
      expect(retrievedAccount?.id).toBe(secondUserAccount.id);
      expect(retrievedAccount?.name).toBe(accountData.name);
    });

    it('throws RepositoryNotFoundError when account is tombstoned', async () => {
      const tombstonedAccount = await testDB.createAccount(
        user.id,
        usdCommodity.id,
        {
          name: 'Tombstoned Account',
          type: 'asset',
        },
      );

      await testDB.db
        .update(accountsTable)
        .set({ isTombstone: true })
        .where(eq(accountsTable.id, tombstonedAccount.id));

      await expect(
        accountRepository.update(user.id, tombstonedAccount.id, {
          name: 'Updated Tombstoned Account',
          type: 'expense',
          updatedAt: Timestamp.create().valueOf(),
        }),
      ).rejects.toThrowError(RepositoryNotFoundError);
    });

    it('should preserve commodityId when updating allowed account fields', async () => {
      const updatedAccountData = {
        name: 'Updated Account',
        type: 'expense' as const,
        updatedAt: Timestamp.create().valueOf(),
      };

      await accountRepository.update(user.id, account.id, updatedAccountData);

      const retrievedAccount = await testDB.getAccountById(account.id);

      expect(retrievedAccount).toBeDefined();
      expect(retrievedAccount?.id).toBe(account.id);
      expect(retrievedAccount?.commodityId).toBe(account.commodityId);
    });

    it('should not persist isClosed through the regular update method', async () => {
      const updatedAccountData = {
        isClosed: true,
        name: 'Updated Account',
        type: 'expense' as const,
        updatedAt: Timestamp.create().valueOf(),
      };

      await accountRepository.update(user.id, account.id, updatedAccountData);

      const retrievedAccount = await testDB.getAccountById(account.id);

      expect(retrievedAccount).toBeDefined();
      expect(retrievedAccount?.id).toBe(account.id);
      expect(retrievedAccount?.isClosed).not.toBe(true);
    });

    it('updates only allowlisted fields', async () => {
      const maliciousData = {
        createdAt: Timestamp.create().valueOf(),
        id: 'malicious-id',
        name: 'Updated Account',
        type: 'expense' as const,
        updatedAt: Timestamp.create().valueOf(),
      };

      await accountRepository.update(user.id, account.id, maliciousData);

      const updatedAccount = await testDB.getAccountById(account.id);

      expect(updatedAccount?.id).toBe(account.id);
      expect(updatedAccount?.userId).toBe(user.id);
      expect(updatedAccount?.name).toBe(maliciousData.name);
    });
  });

  describe('delete', () => {
    let account: AccountDbRow;

    beforeEach(async () => {
      account = await testDB.createAccount(user.id, usdCommodity.id);
    });

    it('marks an active account as tombstoned', async () => {
      const data = {
        isTombstone: true,
        updatedAt: Timestamp.restore('2030-01-01T00:00:00.000Z').valueOf(),
      };

      await accountRepository.delete(user.id, account.id, data);

      const deletedAccount = await testDB.getAccountById(account.id);

      expect(deletedAccount).toBeDefined();
      expect(deletedAccount?.isTombstone).toBe(true);
      expect(deletedAccount?.updatedAt).toBe(data.updatedAt);
      expect(deletedAccount?.updatedAt).not.toBe(account.updatedAt);

      const retrievedAccount = accountRepository.getById(user.id, account.id);

      const userAccounts = await accountRepository.getAll(user.id, {
        status: 'all',
      });

      await expect(retrievedAccount).rejects.toThrowError(
        RepositoryNotFoundError,
      );

      expect(userAccounts.length).toBe(0);
    });

    it('throws RepositoryNotFoundError when account belongs to another user', async () => {
      const secondUser = await testDB.createUser({
        email: 'second-user@example.com',
        name: 'Second User',
      });
      const secondUserCommodity = await testDB.createCommodity(secondUser.id, {
        code: CommodityCode.create('USD').valueOf(),
      });

      const createdAccount = await testDB.createAccount(
        secondUser.id,
        secondUserCommodity.id,
        {
          name: 'Shared Account Name',
          type: 'asset',
        },
      );

      await expect(
        accountRepository.delete(user.id, createdAccount.id, {
          updatedAt: Timestamp.create().valueOf(),
        }),
      ).rejects.toThrowError(RepositoryNotFoundError);

      const retrievedAccount = await testDB.getAccountById(createdAccount.id);

      compareEntities(retrievedAccount!, createdAccount);
    });

    it('throws RepositoryNotFoundError when account does not exist', async () => {
      const result = accountRepository.delete(user.id, Id.create().valueOf(), {
        updatedAt: Timestamp.create().valueOf(),
      });

      await expect(result).rejects.toThrowError(RepositoryNotFoundError);

      const retrievedAccount = await testDB.getAccountById(account.id);

      compareEntities(retrievedAccount!, account);
    });

    it('throws RepositoryNotFoundError when account is already tombstoned', async () => {
      await accountRepository.delete(user.id, account.id, {
        updatedAt: Timestamp.restore('2030-01-01T00:00:00.000Z').valueOf(),
      });

      const retrievedAccountBeforeDeleting = await testDB.getAccountById(
        account.id,
      );

      await expect(
        accountRepository.delete(user.id, account.id, {
          updatedAt: Timestamp.restore('2030-01-02T00:00:00.000Z').valueOf(),
        }),
      ).rejects.toThrowError(RepositoryNotFoundError);

      const retrievedAccountAfterDeleting = await testDB.getAccountById(
        account.id,
      );

      compareEntities(
        retrievedAccountAfterDeleting!,
        retrievedAccountBeforeDeleting!,
      );
    });

    it('should preserve isClosed while marking an account as tombstoned', async () => {
      const account = await testDB.createAccount(user.id, usdCommodity.id, {
        isClosed: true,
      });

      await accountRepository.delete(user.id, account.id, {
        updatedAt: Timestamp.restore('2030-01-02T00:00:00.000Z').valueOf(),
      });

      const retrievedAccount = await testDB.getAccountById(account.id);

      expect(retrievedAccount).toBeDefined();
      expect(retrievedAccount?.isClosed).toBe(account.isClosed);
      expect(retrievedAccount?.isTombstone).toBe(true);
    });

    it('should not allow updating any other fields while marking an account as tombstoned', async () => {
      const account = await testDB.createAccount(user.id, usdCommodity.id);

      const maliciousData = {
        createdAt: Timestamp.create().valueOf(),
        id: 'malicious-id',
        isClosed: true,
        name: 'Updated Account',
        type: 'expense' as const,
        updatedAt: Timestamp.create().valueOf(),
      };

      await accountRepository.delete(user.id, account.id, maliciousData);
      const updatedAccount = await testDB.getAccountById(account.id);

      expect(updatedAccount?.isTombstone).toBe(true);

      compareEntities(updatedAccount!, account, ['isTombstone', 'updatedAt']);
    });
  });

  describe('close', () => {
    let account: AccountDbRow;

    beforeEach(async () => {
      account = await testDB.createAccount(user.id, usdCommodity.id);
    });

    it('closes an active account', async () => {
      const closedData = {
        action: 'close' as const,
        updatedAt: Timestamp.restore('2030-01-01T00:00:00.000Z').valueOf(),
      };

      await accountRepository.close(user.id, account.id, closedData);

      const retrievedAccount = await accountRepository.getById(
        user.id,
        account.id,
      );

      expect(retrievedAccount).toBeDefined();
      expect(retrievedAccount.isClosed).toBe(true);
      expect(retrievedAccount.updatedAt).toBe(closedData.updatedAt);
      expect(retrievedAccount.updatedAt).not.toBe(account.updatedAt);

      expect(retrievedAccount?.isClosed).toBe(true);
    });

    it('updates only isClosed and updatedAt when closing an account', async () => {
      const closedData = {
        action: 'close' as const,
        updatedAt: Timestamp.restore('2030-01-01T00:00:00.000Z').valueOf(),
      };

      await accountRepository.close(user.id, account.id, closedData);

      const retrievedAccount = await accountRepository.getById(
        user.id,
        account.id,
      );

      expect(retrievedAccount).toBeDefined();
      expect(retrievedAccount?.isClosed).toBe(true);
      expect(retrievedAccount?.updatedAt).toBe(closedData.updatedAt);
      expect(retrievedAccount?.updatedAt).not.toBe(account.updatedAt);

      compareEntities(retrievedAccount, account, ['isClosed', 'updatedAt']);
    });

    it('throws RepositoryNotFoundError when account does not exist', async () => {
      const promise = accountRepository.close(user.id, Id.create().valueOf(), {
        updatedAt: Timestamp.restore('2030-01-01T00:00:00.000Z').valueOf(),
      });

      await expect(promise).rejects.toThrowError(RepositoryNotFoundError);
    });

    it('throws RepositoryNotFoundError when account belongs to another user', async () => {
      const secondUser = await testDB.createUser({
        email: 'seconduser@example.com',
      });

      const promise = accountRepository.close(secondUser.id, account.id, {
        updatedAt: Timestamp.restore('2030-01-01T00:00:00.000Z').valueOf(),
      });

      await expect(promise).rejects.toThrowError(RepositoryNotFoundError);
    });

    it('is idempotent for an already closed account', async () => {
      const initialUpdatedAt = Timestamp.restore(
        '2030-01-01T00:00:00.000Z',
      ).valueOf();
      const ignoredUpdatedAt = Timestamp.restore(
        '2031-01-01T00:00:00.000Z',
      ).valueOf();

      await accountRepository.close(user.id, account.id, {
        updatedAt: initialUpdatedAt,
      });

      const initialClosedAccount = await accountRepository.getById(
        user.id,
        account.id,
      );

      await accountRepository.close(user.id, account.id, {
        updatedAt: ignoredUpdatedAt,
      });

      const retrievedCloseAccount = await accountRepository.getById(
        user.id,
        account.id,
      );

      compareEntities(initialClosedAccount, retrievedCloseAccount);
    });

    it('throws RepositoryNotFoundError when account is tombstoned', async () => {
      const account = await testDB.createAccount(user.id, usdCommodity.id, {
        isTombstone: true,
      });

      await expect(
        accountRepository.close(user.id, account.id, {
          updatedAt: Timestamp.create().valueOf(),
        }),
      ).rejects.toThrowError(RepositoryNotFoundError);
    });
  });

  describe('open', () => {
    it('should open a closed account', async () => {
      const account = await testDB.createAccount(user.id, usdCommodity.id, {
        isClosed: true,
      });

      const updatedAt = Timestamp.restore('2030-01-01T00:00:00.000Z').valueOf();

      await accountRepository.open(user.id, account.id, {
        updatedAt,
      });

      const retrievedAccount = await accountRepository.getById(
        user.id,
        account.id,
      );

      compareEntities(retrievedAccount, account, ['isClosed', 'updatedAt']);
      expect(retrievedAccount?.isClosed).toBe(false);
      expect(retrievedAccount?.updatedAt).toBe(updatedAt);
    });

    it('should be idempotent for an already open account', async () => {
      const account = await testDB.createAccount(user.id, usdCommodity.id, {
        isClosed: false,
      });

      const initialUpdatedAt = Timestamp.restore(
        '2030-01-01T00:00:00.000Z',
      ).valueOf();
      const ignoredUpdatedAt = Timestamp.restore(
        '2031-01-01T00:00:00.000Z',
      ).valueOf();

      await accountRepository.open(user.id, account.id, {
        updatedAt: initialUpdatedAt,
      });

      const initialOpenAccount = await accountRepository.getById(
        user.id,
        account.id,
      );

      await accountRepository.open(user.id, account.id, {
        updatedAt: ignoredUpdatedAt,
      });

      const retrievedOpenAccount = await accountRepository.getById(
        user.id,
        account.id,
      );

      compareEntities(initialOpenAccount, retrievedOpenAccount);
    });

    it('should throw RepositoryNotFoundError when account does not exist', async () => {
      const promise = accountRepository.open(user.id, Id.create().valueOf(), {
        updatedAt: Timestamp.restore('2030-01-01T00:00:00.000Z').valueOf(),
      });

      await expect(promise).rejects.toThrowError(RepositoryNotFoundError);
    });

    it('should throw RepositoryNotFoundError when account is tombstoned', async () => {
      const account = await testDB.createAccount(user.id, usdCommodity.id, {
        isTombstone: true,
      });

      await expect(
        accountRepository.open(user.id, account.id, {
          updatedAt: Timestamp.create().valueOf(),
        }),
      ).rejects.toThrowError(RepositoryNotFoundError);
    });

    it('should throw RepositoryNotFoundError when account belongs to another user', async () => {
      const secondUser = await testDB.createUser({
        email: 'seconduser@example.com',
      });

      const account = await testDB.createAccount(user.id, usdCommodity.id);

      const promise = accountRepository.open(secondUser.id, account.id, {
        updatedAt: Timestamp.restore('2030-01-01T00:00:00.000Z').valueOf(),
      });

      await expect(promise).rejects.toThrowError(RepositoryNotFoundError);
    });
  });

  describe('ensureUserOwnsAccount', () => {
    it('returns account snapshot when user owns the account', async () => {
      const account = await testDB.createAccount(user.id, usdCommodity.id);

      const retrievedAccount = await accountRepository.ensureUserOwnsAccount(
        user.id,
        account.id,
      );

      compareEntities(retrievedAccount, account);
    });

    it('throws RepositoryNotFoundError when account does not exist', async () => {
      await expect(
        accountRepository.ensureUserOwnsAccount(user.id, Id.create().valueOf()),
      ).rejects.toThrowError(RepositoryNotFoundError);
    });

    it('throws RepositoryNotFoundError when account is tombstoned', async () => {
      const account = await testDB.createAccount(user.id, usdCommodity.id, {
        isTombstone: true,
      });

      await expect(
        accountRepository.ensureUserOwnsAccount(user.id, account.id),
      ).rejects.toThrowError(RepositoryNotFoundError);
    });

    it('throws ForbiddenAccessError when account belongs to another user', async () => {
      const secondUser = await testDB.createUser({
        email: 'second-user@example.com',
      });
      const secondUserCommodity = await testDB.createCommodity(secondUser.id, {
        code: CommodityCode.create('USD').valueOf(),
      });

      const account = await testDB.createAccount(
        secondUser.id,
        secondUserCommodity.id,
      );

      await expect(
        accountRepository.ensureUserOwnsAccount(user.id, account.id),
      ).rejects.toThrowError(ForbiddenAccessError);
    });
  });

  describe('existsActiveByCommodityId', () => {
    it('returns true when a non-tombstoned account references the commodity', async () => {
      await testDB.createAccount(user.id, usdCommodity.id);

      await expect(
        accountRepository.existsActiveByCommodityId(user.id, usdCommodity.id),
      ).resolves.toBe(true);
    });

    it('returns false when only tombstoned accounts reference the commodity', async () => {
      await testDB.createAccount(user.id, usdCommodity.id, {
        isTombstone: true,
      });

      await expect(
        accountRepository.existsActiveByCommodityId(user.id, usdCommodity.id),
      ).resolves.toBe(false);
    });

    it('returns false for accounts owned by another user', async () => {
      const secondUser = await testDB.createUser({
        email: 'second-user@example.com',
      });
      const secondUserCommodity = await testDB.createCommodity(secondUser.id, {
        code: CommodityCode.create('USD').valueOf(),
      });

      await testDB.createAccount(secondUser.id, secondUserCommodity.id);

      await expect(
        accountRepository.existsActiveByCommodityId(
          user.id,
          secondUserCommodity.id,
        ),
      ).resolves.toBe(false);
    });
  });

  describe('getByIds', () => {
    it.todo('should return all requested accounts owned by the user');

    it.todo(
      'should throw RepositoryNotFoundError when any requested account does not exist',
    );

    it.todo(
      'should throw RepositoryNotFoundError when any requested account is tombstoned',
    );

    it.todo(
      'should throw RepositoryNotFoundError when any requested account belongs to another user',
    );
  });

  describe('timestamp behavior', () => {
    it('sets createdAt and updatedAt on creation', async () => {
      const beforeCreate = dayjs();

      const newAccount = getAccountData({
        commodityId: usdCommodity.id,
        name: 'This is a test account',
        type: 'asset',
        userId: user.id,
      });
      await accountRepository.create(user.id, newAccount);

      const account = await testDB.getAccountById(newAccount.id);

      const accountDate = dayjs(account?.createdAt);

      const afterCreate = dayjs();

      expect(account?.createdAt).toBeDefined();
      expect(account?.updatedAt).toBeDefined();
      expect(dayjs(account?.createdAt)).toBeInstanceOf(dayjs);
      expect(dayjs(account?.updatedAt)).toBeInstanceOf(dayjs);

      expect(beforeCreate.unix()).toBeLessThanOrEqual(accountDate.unix());
      expect(accountDate.unix()).toBeLessThanOrEqual(afterCreate.unix());
    });

    it('updates updatedAt on account update', async () => {
      const account = await testDB.createAccount(user.id, usdCommodity.id);
      const originalUpdatedAt = dayjs(account?.updatedAt);

      await new Promise((resolve) => setTimeout(resolve, 1000));

      const updatedData = getAccountData({
        commodityId: eurCommodity.id,
        name: 'Updated Account',
        type: 'expense',
        userId: user.id,
      });

      await accountRepository.update(user.id, account.id, updatedData);

      const updatedAccount = await testDB.getAccountById(account.id);

      const newUpdatedAt = dayjs(updatedAccount?.updatedAt);

      expect(updatedAccount?.updatedAt).toBe(updatedData.updatedAt);
      expect(updatedAccount?.updatedAt).not.toBe(account.updatedAt);
      expect(originalUpdatedAt.unix()).toBeLessThanOrEqual(newUpdatedAt.unix());
    });
  });
});
