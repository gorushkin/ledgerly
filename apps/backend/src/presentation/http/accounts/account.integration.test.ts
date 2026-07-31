import { ROUTES } from '@ledgerly/shared/routes';
import {
  AccountCreateDTO,
  AccountResponseDTO,
  AccountTypeValue,
  ApiErrorResponse,
  apiErrorCodes,
  UUID,
} from '@ledgerly/shared/types';
import { CommodityDbRow } from 'src/db/schemas/commodities';
import { TestDB } from 'src/db/test-db';
import { compareEntityArrays } from 'src/db/test-utils/entityComparer';
import { AccountType } from 'src/domain';
import { Amount, CommodityCode } from 'src/domain/domain-core';
import { Id } from 'src/domain/domain-core/value-objects/Id';
import { createServer } from 'src/presentation/http';
import { createHttpTestClient } from 'src/presentation/http/test-utils';
import { describe, beforeEach, it, expect } from 'vitest';

const url = `/api${ROUTES.accounts}`;

const closedAccountsData = [
  {
    commodityId: Id.create().valueOf(),
    description: 'Closed account 1 for testing purposes',
    initialBalance: Amount.create('1000').valueOf(),
    isClosed: true,
    name: 'Test Account',
    type: AccountType.create('asset').valueOf(),
  },
  {
    commodityId: Id.create().valueOf(),
    description: 'Closed account 2 for testing purposes',
    initialBalance: Amount.create('1000').valueOf(),
    isClosed: true,
    name: 'Savings Account',
    type: AccountType.create('asset').valueOf(),
  },
];

const openAccountsData = [
  {
    commodityId: Id.create().valueOf(),
    description: 'Open account 1 for testing purposes',
    initialBalance: Amount.create('1000').valueOf(),
    isClosed: false,
    name: 'Open Account',
    type: AccountType.create('asset').valueOf(),
  },
  {
    commodityId: Id.create().valueOf(),
    description: 'Open account 2 for testing purposes',
    initialBalance: Amount.create('1000').valueOf(),
    isClosed: false,
    name: 'Open Savings Account',
    type: AccountType.create('asset').valueOf(),
  },
];

const deletedAccountsData = [
  {
    commodityId: Id.create().valueOf(),
    description: 'Deleted account 1 for testing purposes',
    initialBalance: Amount.create('1000').valueOf(),
    isTombstone: true,
    name: 'Deleted Account',
    type: AccountType.create('asset').valueOf(),
  },
  {
    commodityId: Id.create().valueOf(),
    description: 'Deleted account 2 for testing purposes',
    initialBalance: Amount.create('1000').valueOf(),
    isTombstone: true,
    name: 'Deleted Savings Account',
    type: AccountType.create('asset').valueOf(),
  },
];

const allAccountsData = [
  ...closedAccountsData,
  ...openAccountsData,
  ...deletedAccountsData,
];

const getUserTestAccounts = (userId: UUID): AccountCreateDTO[] => {
  return allAccountsData.map((account) => ({
    ...account,
    userId,
  }));
};
const testUserData = {
  email: 'test@example.com',
  name: 'Test User',
  password: 'Password123!',
};

describe('Accounts Integration Tests', () => {
  let testDB: TestDB;
  let server: ReturnType<typeof createServer>;
  let authToken: string;
  let userId: UUID;
  let otherUserId: UUID;
  let accounts: AccountResponseDTO[] = [];
  let commodity: CommodityDbRow;
  let injectAuthorized: ReturnType<
    typeof createHttpTestClient
  >['injectAuthorized'];

  let injectWithToken: ReturnType<
    typeof createHttpTestClient
  >['injectWithToken'];

  beforeEach(async () => {
    testDB = new TestDB();
    server = createServer(testDB.db);

    ({ injectAuthorized, injectWithToken } = createHttpTestClient(
      server,
      () => authToken,
    ));

    await testDB.setupTestDb();

    await server.ready();

    const user = await testDB.createUser(testUserData);

    const otherUser = await testDB.createUser({
      email: 'otheruser@example.com',
    });

    otherUserId = Id.restore(otherUser.id).valueOf();

    const token = server.jwt.sign({
      email: user.email,
      userId: user.id,
    });

    authToken = token;

    const decoded = server.jwt.decode(token) as unknown as { userId: UUID };
    userId = Id.restore(decoded.userId).valueOf();
    commodity = await testDB.createCommodity(userId);

    const testAccountsDTO = getUserTestAccounts(
      Id.restore(decoded.userId).valueOf(),
    );

    const promises = testAccountsDTO.map(async (account) => {
      const commodity = await testDB.createCommodity(userId);
      return testDB.createAccount(userId, commodity.id, account);
    });

    accounts = await Promise.all(promises);
  });

  describe('GET /api/accounts', () => {
    const testCases = [
      {
        description:
          'should return all active open accounts by default for the user',
        expectedAccounts: (accounts: AccountResponseDTO[]) =>
          accounts.filter(
            (account) => !account.isClosed && !account.isTombstone,
          ),
        query: {},
      },
      {
        description:
          'should return all accounts including closed when query param status=all',
        expectedAccounts: (accounts: AccountResponseDTO[]) =>
          accounts.filter((account) => !account.isTombstone),
        query: { status: 'all' },
      },
      {
        description:
          'should return all closed accounts when query param status=closed',
        expectedAccounts: (accounts: AccountResponseDTO[]) =>
          accounts.filter(
            (account) => account.isClosed && !account.isTombstone,
          ),
        query: { status: 'closed' },
      },
    ];

    testCases.forEach(({ description, expectedAccounts, query }) => {
      it(description, async () => {
        const queryString = new URLSearchParams(
          query as Record<string, string>,
        ).toString();

        const response = await injectAuthorized({
          method: 'GET',
          url: `${url}?${queryString}`,
        });

        const responseAccounts = JSON.parse(
          response.body,
        ) as AccountResponseDTO[];

        expect(response.statusCode).toBe(200);
        compareEntityArrays(responseAccounts, expectedAccounts(accounts));
      });
    });
  });

  describe('GET /api/accounts/:id', () => {
    it('should return 200 and the account by id', async () => {
      const response = await injectAuthorized({
        method: 'GET',
        url: `${url}/${accounts[0].id}`,
      });

      const account = JSON.parse(response.body) as AccountResponseDTO;

      expect(response.statusCode).toBe(200);
      expect(account.name).toBe(accounts[0].name);
    });
  });

  describe('POST /api/accounts', () => {
    it('should return 201 and create a new account', async () => {
      const accountCountBeforeCreation = accounts.filter(
        (account) => !account.isTombstone,
      ).length;

      const commodity = await testDB.createCommodity(userId, {
        code: CommodityCode.create('USD').valueOf(),
        name: 'US Dollar',
      });

      const payload: AccountCreateDTO = {
        commodityId: commodity.id,
        description: 'This is a new account',
        initialBalance: Amount.create('1000').valueOf(),
        name: 'New Account',
        type: 'asset' as AccountTypeValue,
      };

      const response = await injectAuthorized({
        method: 'POST',
        payload,
        url,
      });

      const createdAccount = JSON.parse(response.body) as AccountResponseDTO;

      expect(response.statusCode).toBe(201);
      expect(createdAccount.name).toBe(payload.name);
      expect(createdAccount.type).toBe(payload.type);
      expect(createdAccount.description).toBe(payload.description);

      const finalResponse = await injectAuthorized({
        method: 'GET',
        url: `${url}?status=all`,
      });

      const accountsAfterCreation = JSON.parse(
        finalResponse.body,
      ) as AccountResponseDTO[];

      expect(accountsAfterCreation.length).toBe(accountCountBeforeCreation + 1);
      expect(accountsAfterCreation).toContainEqual(createdAccount);
    });
  });

  describe('DELETE /api/accounts/:id', () => {
    it('should return 204 and delete an account by id', async () => {
      const accountCountBeforeDeletion = accounts.filter(
        (account) => !account.isTombstone,
      ).length;

      const accountToDelete = accounts[0];

      const response = await injectAuthorized({
        method: 'DELETE',
        url: `${url}/${accountToDelete.id}`,
      });

      expect(response.statusCode).toBe(204);

      const finalResponse = await injectAuthorized({
        method: 'GET',
        url: `${url}/?status=all`,
      });

      const accountsAfterDeletion = JSON.parse(
        finalResponse.body,
      ) as AccountResponseDTO[];

      expect(accountsAfterDeletion.length).toBe(accountCountBeforeDeletion - 1);
      expect(accountsAfterDeletion).not.toContainEqual(accountToDelete);
    });
  });

  describe('POST /api/accounts/:id/close', () => {
    it('should return 200 and close an open account by id', async () => {
      const accountToClose = accounts.find(
        (account) => !account.isClosed && !account.isTombstone,
      );

      if (!accountToClose) {
        throw new Error('No account available to close');
      }

      const response = await injectAuthorized({
        method: 'POST',
        url: `${url}/${accountToClose.id}/close`,
      });

      const closedAccount = JSON.parse(response.body) as AccountResponseDTO;

      expect(response.statusCode).toBe(200);
      expect(closedAccount).toMatchObject({
        id: accountToClose.id,
        isClosed: true,
      });

      const finalResponse = await injectAuthorized({
        method: 'GET',
        url: `${url}/${accountToClose.id}`,
      });

      const retrievedAccount = JSON.parse(
        finalResponse.body,
      ) as AccountResponseDTO;

      expect(finalResponse.statusCode).toBe(200);
      expect(retrievedAccount.isClosed).toBe(true);
    });

    it('should be idempotent for an already closed account', async () => {
      const closedAccount = accounts.find(
        (account) => account.isClosed && !account.isTombstone,
      );

      if (!closedAccount) {
        throw new Error('No closed account available');
      }

      const response = await injectAuthorized({
        method: 'POST',
        url: `${url}/${closedAccount.id}/close`,
      });

      const account = JSON.parse(response.body) as AccountResponseDTO;

      expect(response.statusCode).toBe(200);
      expect(account).toMatchObject({
        id: closedAccount.id,
        isClosed: true,
      });
    });

    it('should return 404 when account belongs to a different user', async () => {
      const otherUserCommodity = await testDB.createCommodity(otherUserId);
      const otherUserAccount = await testDB.createAccount(
        otherUserId,
        otherUserCommodity.id,
      );

      const response = await injectAuthorized({
        method: 'POST',
        url: `${url}/${otherUserAccount.id}/close`,
      });

      expect(response.statusCode).toBe(404);
    });

    it('should return 404 when account is deleted', async () => {
      const deletedAccount = accounts.find((account) => account.isTombstone);

      const response = await injectAuthorized({
        method: 'POST',
        url: `${url}/${deletedAccount?.id}/close`,
      });

      expect(response.statusCode).toBe(404);
    });

    it('should return 400 when account id has an invalid UUID format', async () => {
      const response = await injectAuthorized({
        method: 'POST',
        url: `${url}/invalid-uuid/close`,
      });

      expect(response.statusCode).toBe(400);
    });
  });

  describe('POST /api/accounts/:id/open', () => {
    it('should return 200 and open a closed account by id', async () => {
      const accountToOpen = accounts.find(
        (account) => account.isClosed && !account.isTombstone,
      );

      if (!accountToOpen) {
        throw new Error('No account available to open');
      }

      const response = await injectAuthorized({
        method: 'POST',
        url: `${url}/${accountToOpen.id}/open`,
      });

      const openedAccount = JSON.parse(response.body) as AccountResponseDTO;

      expect(response.statusCode).toBe(200);
      expect(openedAccount).toMatchObject({
        id: accountToOpen.id,
        isClosed: false,
      });

      const finalResponse = await injectAuthorized({
        method: 'GET',
        url: `${url}/${accountToOpen.id}`,
      });

      const retrievedAccount = JSON.parse(
        finalResponse.body,
      ) as AccountResponseDTO;

      expect(finalResponse.statusCode).toBe(200);
      expect(retrievedAccount.isClosed).toBe(false);
    });

    it('should be idempotent for an already open account', async () => {
      const openAccount = accounts.find(
        (account) => !account.isClosed && !account.isTombstone,
      );

      if (!openAccount) {
        throw new Error('No open account available');
      }

      const response = await injectAuthorized({
        method: 'POST',
        url: `${url}/${openAccount.id}/open`,
      });

      const account = JSON.parse(response.body) as AccountResponseDTO;

      expect(response.statusCode).toBe(200);
      expect(account).toMatchObject({
        id: openAccount.id,
        isClosed: false,
      });
    });

    it('should return 404 when account belongs to a different user', async () => {
      const otherUserCommodity = await testDB.createCommodity(otherUserId);
      const otherUserAccount = await testDB.createAccount(
        otherUserId,
        otherUserCommodity.id,
        { isClosed: true },
      );

      const response = await injectAuthorized({
        method: 'POST',
        url: `${url}/${otherUserAccount.id}/open`,
      });

      expect(response.statusCode).toBe(404);
    });

    it('should return 404 when account is deleted', async () => {
      const deletedAccount = accounts.find((account) => account.isTombstone);

      const response = await injectAuthorized({
        method: 'POST',
        url: `${url}/${deletedAccount?.id}/open`,
      });

      expect(response.statusCode).toBe(404);
    });

    it('should return 400 when account id has an invalid UUID format', async () => {
      const response = await injectAuthorized({
        method: 'POST',
        url: `${url}/invalid-uuid/open`,
      });

      expect(response.statusCode).toBe(400);
    });
  });

  describe('PATCH /api/accounts/:id', () => {
    it('should return 200 and update an account by id', async () => {
      const accountToUpdate = accounts.find(
        (account) => !account.isClosed && !account.isTombstone,
      );

      const updatedData = {
        name: 'Updated Account Name',
      };

      if (!accountToUpdate) {
        throw new Error('No account available for update');
      }

      const response = await injectAuthorized({
        method: 'PATCH',
        payload: updatedData,
        url: `${url}/${accountToUpdate.id}`,
      });

      const updatedAccount = JSON.parse(response.body) as AccountResponseDTO;

      expect(response.statusCode).toBe(200);
      expect(updatedAccount.name).toBe(updatedData.name);

      const finalResponse = await injectAuthorized({
        method: 'GET',
        url: `${url}?status=all`,
      });

      const accountsAfterUpdate = JSON.parse(
        finalResponse.body,
      ) as AccountResponseDTO[];

      expect(accountsAfterUpdate).toContainEqual(updatedAccount);
    });
  });

  describe('Authentication', () => {
    it('should return 401 when no auth token is provided', async () => {
      const response = await server.inject({
        method: 'GET',
        url,
      });

      expect(response.statusCode).toBe(401);
    });

    it('should return 401 when an invalid auth token is provided', async () => {
      const response = await injectWithToken('invalidToken', {
        method: 'GET',
        url,
      });

      expect(response.statusCode).toBe(401);
    });

    it('should return 401 when an expired auth token is provided', async () => {
      const expiredToken: string = server.jwt.sign({
        email: testUserData.email,
        exp: Math.floor(Date.now() / 1000) - 3600,
        userId,
      });

      const response = await injectWithToken(expiredToken, {
        method: 'GET',
        url,
      });

      expect(response.statusCode).toBe(401);
    });
  });

  describe('GET /api/accounts - Validation', () => {
    it('should return 400 when status is an invalid enum value', async () => {
      const response = await injectAuthorized({
        method: 'GET',
        url: `${url}?status=archived`,
      });

      expect(response.statusCode).toBe(400);
    });
  });

  describe('POST /api/accounts - Validation', () => {
    it('should return 400 when name is empty', async () => {
      const payload: AccountCreateDTO = {
        commodityId: commodity.id,
        description: 'This is a new account',
        initialBalance: Amount.create('1000').valueOf(),
        name: '',
        type: 'asset' as AccountTypeValue,
      };

      const response = await injectAuthorized({
        method: 'POST',
        payload,
        url,
      });

      expect(response.statusCode).toBe(400);
    });

    it('should return 400 when name is missing', async () => {
      const payload: AccountCreateDTO = {
        commodityId: commodity.id,
        description: 'This is a new account',
        initialBalance: Amount.create('1000').valueOf(),
        type: 'asset' as AccountTypeValue,
      } as unknown as AccountCreateDTO; // Type assertion to bypass TypeScript checks for testing purposes

      const response = await injectAuthorized({
        method: 'POST',
        payload,
        url,
      });

      expect(response.statusCode).toBe(400);
    });

    it('should return 400 when name is not a string', async () => {
      const payload: AccountCreateDTO = {
        commodityId: commodity.id,
        description: 'This is a new account',
        initialBalance: Amount.create('1000').valueOf(),
        name: 123 as unknown as string,
        type: 'asset' as AccountTypeValue,
      };

      const response = await injectAuthorized({
        method: 'POST',
        payload,
        url,
      });

      expect(response.statusCode).toBe(400);
    });

    it('should return 400 when commodityId is empty', async () => {
      const payload: AccountCreateDTO = {
        commodityId: '' as unknown as UUID,
        description: 'This is a new account',
        initialBalance: Amount.create('1000').valueOf(),
        name: 'New Account',
        type: 'asset' as AccountTypeValue,
      };

      const response = await injectAuthorized({
        method: 'POST',
        payload,
        url,
      });

      expect(response.statusCode).toBe(400);
    });

    it('should return 400 when commodityId is missing', async () => {
      const payload: AccountCreateDTO = {
        description: 'This is a new account',
        initialBalance: Amount.create('1000').valueOf(),
        name: 'New Account',
        type: 'asset' as AccountTypeValue,
      } as unknown as AccountCreateDTO; // Type assertion to bypass TypeScript checks for testing purposes

      const response = await injectAuthorized({
        method: 'POST',
        payload,
        url,
      });

      expect(response.statusCode).toBe(400);
    });

    it('should return 400 when commodityId has an invalid UUID format', async () => {
      const payload: AccountCreateDTO = {
        commodityId: 'invalid-uuid' as unknown as UUID,
        description: 'This is a new account',
        initialBalance: Amount.create('1000').valueOf(),
        name: 'New Account',
        type: 'asset' as AccountTypeValue,
      };

      const response = await injectAuthorized({
        method: 'POST',
        payload,
        url,
      });

      expect(response.statusCode).toBe(400);
    });

    it('should return 404 when commodityId does not exist', async () => {
      const payload: AccountCreateDTO = {
        commodityId: Id.create().valueOf(),
        description: 'This is a new account',
        initialBalance: Amount.create('1000').valueOf(),
        name: 'New Account',
        type: 'asset' as AccountTypeValue,
      };

      const response = await injectAuthorized({
        method: 'POST',
        payload,
        url,
      });

      expect(response.statusCode).toBe(404);
    });

    it('should return 404 when commodityId belongs to another user', async () => {
      const otherUserCommodity = await testDB.createCommodity(otherUserId);

      const payload: AccountCreateDTO = {
        commodityId: otherUserCommodity.id,
        description: 'This is a new account',
        initialBalance: Amount.create('1000').valueOf(),
        name: 'New Account',
        type: AccountType.create('asset').valueOf(),
      };

      const response = await injectAuthorized({
        method: 'POST',
        payload,
        url,
      });

      expect(response.statusCode).toBe(404);
    });

    it('should return 404 when commodityId points to a deleted commodity', async () => {
      await testDB.deleteCommodityById(commodity.id);

      const payload: AccountCreateDTO = {
        commodityId: commodity.id,
        description: 'This is a new account',
        initialBalance: Amount.create('1000').valueOf(),
        name: 'New Account',
        type: 'asset' as AccountTypeValue,
      };

      const response = await injectAuthorized({
        method: 'POST',
        payload,
        url,
      });

      expect(response.statusCode).toBe(404);
    });

    it('should return 400 when type is empty', async () => {
      const payload: AccountCreateDTO = {
        commodityId: commodity.id,
        description: 'This is a new account',
        initialBalance: Amount.create('1000').valueOf(),
        name: 'New Account',
        type: '' as unknown as AccountTypeValue,
      };

      const response = await injectAuthorized({
        method: 'POST',
        payload,
        url,
      });

      expect(response.statusCode).toBe(400);
    });

    it('should return 400 when type is an invalid enum value', async () => {
      const payload: AccountCreateDTO = {
        commodityId: commodity.id,
        description: 'This is a new account',
        initialBalance: Amount.create('1000').valueOf(),
        name: 'New Account',
        type: 'invalid-type' as unknown as AccountTypeValue,
      };

      const response = await injectAuthorized({
        method: 'POST',
        payload,
        url,
      });

      expect(response.statusCode).toBe(400);
    });

    it('should return 400 when type is missing', async () => {
      const payload: AccountCreateDTO = {
        commodityId: commodity.id,
        description: 'This is a new account',
        initialBalance: Amount.create('1000').valueOf(),
        name: 'New Account',
      } as unknown as AccountCreateDTO;

      const response = await injectAuthorized({
        method: 'POST',
        payload,
        url,
      });

      expect(response.statusCode).toBe(400);
    });

    it('should return 409 when account name already exists for user', async () => {
      const payload: AccountCreateDTO = {
        commodityId: commodity.id,
        description: 'This is a new account',
        initialBalance: Amount.create('1000').valueOf(),
        name: accounts[0].name,
        type: 'asset' as AccountTypeValue,
      } as unknown as AccountCreateDTO; // Type assertion to bypass TypeScript checks for testing purposes

      const response = await injectAuthorized({
        method: 'POST',
        payload,
        url,
      });

      expect(response.statusCode).toBe(409);
    });

    it('should return 400 when description is not a string', async () => {
      const payload: AccountCreateDTO = {
        commodityId: commodity.id,
        description: 123 as unknown as string,
        initialBalance: Amount.create('1000').valueOf(),
        name: 'New Account',
        type: 'asset' as AccountTypeValue,
      };

      const response = await injectAuthorized({
        method: 'POST',
        payload,
        url,
      });

      expect(response.statusCode).toBe(400);
    });

    it('should return 400 when extra unexpected fields are provided', async () => {
      const payload: AccountCreateDTO & { extraField?: string } = {
        commodityId: commodity.id,
        description: 'This is a new account',
        extraField: 'unexpected',
        initialBalance: Amount.create('1000').valueOf(),
        name: 'New Account',
        type: 'asset' as AccountTypeValue,
      };

      const response = await injectAuthorized({
        method: 'POST',
        payload,
        url,
      });

      expect(response.statusCode).toBe(400);
    });
  });

  describe('GET /api/accounts/:id - Edge Cases', () => {
    it('should return 404 when account id does not exist', async () => {
      const nonExistentId = Id.create().valueOf();

      const response = await injectAuthorized({
        method: 'GET',
        url: `/api/accounts/${nonExistentId}`,
      });

      expect(response.statusCode).toBe(404);
    });

    it('should return 400 when account id has an invalid UUID format', async () => {
      const invalidId = 'invalid-uuid';

      const response = await injectAuthorized({
        method: 'GET',
        url: `/api/accounts/${invalidId}`,
      });

      expect(response.statusCode).toBe(400);
    });

    it('should return 404 when account belongs to a different user', async () => {
      const otherUserCommodity = await testDB.createCommodity(otherUserId);

      const otherUserAccount = await testDB.createAccount(
        otherUserId,
        otherUserCommodity.id,
        {
          description: 'Other user account',
          initialBalance: Amount.create('1000').valueOf(),
          name: 'Other User Account',
          type: 'asset' as AccountTypeValue,
        },
      );
      const response = await injectAuthorized({
        method: 'GET',
        url: `/api/accounts/${otherUserAccount.id}`,
      });

      expect(response.statusCode).toBe(404);
    });

    it('should return 404 when account is deleted', async () => {
      const deletedAccount = accounts.find((account) => account.isTombstone);
      const response = await injectAuthorized({
        method: 'GET',
        url: `/api/accounts/${deletedAccount?.id}`,
      });

      expect(response.statusCode).toBe(404);
    });
  });

  describe('PATCH /api/accounts/:id - Validation', () => {
    it('should return 400 when name is empty', async () => {
      const accountToUpdate = accounts[0];

      const response = await injectAuthorized({
        method: 'PATCH',
        payload: {
          name: '',
        },
        url: `/api/accounts/${accountToUpdate.id}`,
      });

      expect(response.statusCode).toBe(400);
    });

    it('should return 400 when name is not a string', async () => {
      const accountToUpdate = accounts[0];

      const response = await injectAuthorized({
        method: 'PATCH',
        payload: {
          name: 123 as unknown as string,
        },
        url: `/api/accounts/${accountToUpdate.id}`,
      });

      expect(response.statusCode).toBe(400);
    });

    it('should return 400 when type is an invalid enum value', async () => {
      const accountToUpdate = accounts[0];

      const response = await injectAuthorized({
        method: 'PATCH',
        payload: {
          type: 'invalid-type' as AccountTypeValue,
        },
        url: `/api/accounts/${accountToUpdate.id}`,
      });

      expect(response.statusCode).toBe(400);
    });

    it('should return 400 when description is not a string', async () => {
      const accountToUpdate = accounts[0];

      const response = await injectAuthorized({
        method: 'PATCH',
        payload: {
          description: 123 as unknown as string,
        },
        url: `/api/accounts/${accountToUpdate.id}`,
      });

      expect(response.statusCode).toBe(400);
    });

    it('should return 404 when account id does not exist', async () => {
      const nonExistentId = '00000000-0000-0000-0000-000000000000';

      const response = await injectAuthorized({
        method: 'PATCH',
        payload: {
          name: 'Updated Name',
        },
        url: `/api/accounts/${nonExistentId}`,
      });

      expect(response.statusCode).toBe(404);
    });

    it('should return 400 when account id has an invalid UUID format', async () => {
      const invalidId = 'invalid-uuid';

      const response = await injectAuthorized({
        method: 'PATCH',
        payload: {
          name: 'Updated Name',
        },
        url: `/api/accounts/${invalidId}`,
      });

      expect(response.statusCode).toBe(400);
    });

    it('should return 409 when updating to duplicate name within same user', async () => {
      const accountToUpdate = accounts[0];
      const duplicateName = accounts[1].name;

      const response = await injectAuthorized({
        method: 'PATCH',
        payload: {
          name: duplicateName,
        },
        url: `/api/accounts/${accountToUpdate.id}`,
      });

      expect(response.statusCode).toBe(409);
    });

    it('should return 400 when empty object is provided', async () => {
      const accountToUpdate = accounts[0];

      const response = await injectAuthorized({
        method: 'PATCH',
        payload: {},
        url: `/api/accounts/${accountToUpdate.id}`,
      });

      expect(response.statusCode).toBe(400);
    });

    it('should return 400 when extra unexpected fields are provided', async () => {
      const accountToUpdate = accounts[0];

      const response = await injectAuthorized({
        method: 'PATCH',
        payload: {
          name: 'Updated Name',
          unexpectedField: 'unexpected',
        },
        url: `/api/accounts/${accountToUpdate.id}`,
      });

      expect(response.statusCode).toBe(400);
    });

    it('should return 404 when account belongs to a different user', async () => {
      const otherUserCommodity = await testDB.createCommodity(otherUserId);

      const otherUserAccount = await testDB.createAccount(
        otherUserId,
        otherUserCommodity.id,
        {
          description: 'Other user account',
          initialBalance: Amount.create('1000').valueOf(),
          name: 'Other User Account',
          type: 'asset' as AccountTypeValue,
        },
      );

      const response = await injectAuthorized({
        method: 'PATCH',
        payload: {
          name: 'Updated Name',
        },
        url: `/api/accounts/${otherUserAccount.id}`,
      });

      expect(response.statusCode).toBe(404);
    });

    it('should return 404 when account is deleted', async () => {
      const deletedAccount = accounts.find((account) => account.isTombstone);
      const response = await injectAuthorized({
        method: 'PATCH',
        payload: {
          name: 'Updated Name',
        },
        url: `/api/accounts/${deletedAccount?.id}`,
      });

      expect(response.statusCode).toBe(404);
    });

    it('should return 409 when changing type for an account with active operations', async () => {
      const accountToUpdate = accounts[0];

      await testDB.createTransactionWithOperations(userId, commodity.id, {
        operations: [
          {
            accountId: accountToUpdate.id,
            amount: Amount.create('100').valueOf(),
            description: 'Test Operation',
            id: Id.create().valueOf(),
            value: Amount.create('100').valueOf(),
          },
        ],
      });

      const response = await injectAuthorized({
        method: 'PATCH',
        payload: {
          type: AccountType.create('liability').valueOf(),
        },
        url: `/api/accounts/${accountToUpdate.id}`,
      });

      expect(response.statusCode).toBe(409);
    });
  });

  describe('DELETE /api/accounts/:id - Edge Cases', () => {
    it('should return 404 when account id does not exist', async () => {
      const nonExistentId = Id.create().valueOf();

      const response = await injectAuthorized({
        method: 'DELETE',
        url: `/api/accounts/${nonExistentId}`,
      });

      expect(response.statusCode).toBe(404);
    });

    it('should return 400 when account id has an invalid UUID format', async () => {
      const invalidId = 'invalid-uuid';

      const response = await injectAuthorized({
        method: 'DELETE',
        url: `/api/accounts/${invalidId}`,
      });

      expect(response.statusCode).toBe(400);
    });

    it('should return 404 when account belongs to a different user', async () => {
      const otherUserAccount = await testDB.createAccount(
        otherUserId,
        commodity.id,
      );

      const response = await injectAuthorized({
        method: 'DELETE',
        url: `/api/accounts/${otherUserAccount?.id}`,
      });

      expect(response.statusCode).toBe(404);
    });

    it('should return 404 when account is already deleted', async () => {
      const deletedAccount = accounts.find((account) => account.isTombstone);
      const response = await injectAuthorized({
        method: 'DELETE',
        url: `/api/accounts/${deletedAccount?.id}`,
      });

      expect(response.statusCode).toBe(404);
    });

    it('should return 409 when account has active operations', async () => {
      const accountToDelete = accounts[0];

      await testDB.createTransactionWithOperations(userId, commodity.id, {
        operations: [
          {
            accountId: accountToDelete.id,
            amount: Amount.create('100').valueOf(),
            description: 'Test Operation',
            id: Id.create().valueOf(),
            value: Amount.create('100').valueOf(),
          },
        ],
      });

      const response = await injectAuthorized({
        method: 'DELETE',
        url: `/api/accounts/${accountToDelete.id}`,
      });

      expect(response.statusCode).toBe(409);
    });
  });

  describe('Database Consistency', () => {
    it('should properly set createdAt and updatedAt timestamps', async () => {
      const payload: AccountCreateDTO = {
        commodityId: commodity.id,
        description: 'This is a new account',
        initialBalance: Amount.create('1000').valueOf(),
        name: 'New Account for Timestamp Test',
        type: AccountType.create('asset').valueOf(),
      };

      const response = await injectAuthorized({
        method: 'POST',
        payload,
        url,
      });

      expect(response.statusCode).toBe(201);

      const createdAccount = JSON.parse(response.body) as AccountResponseDTO;

      expect(createdAccount.name).toBe(payload.name);
      expect(createdAccount.type).toBe(payload.type);
      expect(createdAccount.description).toBe(payload.description);
      expect(createdAccount.initialBalance).toBe(payload.initialBalance);
    });
  });

  describe('Request Format', () => {
    it('should return 400 when request body is not valid JSON', async () => {
      const response = await injectAuthorized({
        headers: {
          'content-type': 'application/json',
        },
        method: 'POST',
        payload: 'invalid-json',
        url,
      });

      expect(response.statusCode).toBe(400);
    });

    it('should return 400 when request body is null', async () => {
      const response = await injectAuthorized({
        headers: {
          'content-type': 'application/json',
        },
        method: 'POST',
        // @ts-expect-error: Testing invalid payload
        payload: null,
        url,
      });

      expect(response.statusCode).toBe(400);
    });

    it('should return 400 when request body is an array instead of object', async () => {
      const response = await injectAuthorized({
        method: 'POST',
        payload: [],
        url,
      });

      expect(response.statusCode).toBe(400);
    });
  });

  describe('Response Format', () => {
    it('should return the standard error format for validation errors', async () => {
      const response = await injectAuthorized({
        method: 'GET',
        url: `${url}?status=archived`,
      });

      const errorResponse = JSON.parse(response.body) as ApiErrorResponse;

      expect(response.statusCode).toBe(400);
      expect(errorResponse).toEqual({
        code: apiErrorCodes.validationFailed,
        context: {
          fields: [
            {
              code: 'INVALID_VALUE',
              path: 'status',
            },
          ],
        },
        error: true,
      });
    });

    it('should include all required fields in successful responses', async () => {
      const response = await injectAuthorized({
        method: 'GET',
        url: `${url}/${accounts[0].id}`,
      });

      const account = JSON.parse(response.body) as AccountResponseDTO;

      expect(response.statusCode).toBe(200);

      const requiredFields = [
        'commodityId',
        'createdAt',
        'currentClearedBalanceLocal',
        'description',
        'id',
        'initialBalance',
        'isClosed',
        'isSystem',
        'isTombstone',
        'name',
        'type',
        'updatedAt',
        'userId',
      ] satisfies (keyof AccountResponseDTO)[];

      requiredFields.forEach((field) => {
        expect(account).toHaveProperty(field);
      });
      expect(typeof account.isClosed).toBe('boolean');
      expect(typeof account.isSystem).toBe('boolean');
      expect(typeof account.isTombstone).toBe('boolean');
    });
  });

  describe('Limits', () => {
    it('should return 400 when account name exceeds the maximum length', async () => {
      const payload: AccountCreateDTO = {
        commodityId: commodity.id,
        description: 'This is a new account',
        initialBalance: Amount.create('1000').valueOf(),
        name: 'a'.repeat(256),
        type: 'asset' as AccountTypeValue,
      };

      const response = await injectAuthorized({
        method: 'POST',
        payload,
        url,
      });

      expect(response.statusCode).toBe(400);
    });
  });
});
