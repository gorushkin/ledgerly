import { CommodityStatusFilterValue } from '@ledgerly/shared/constants';
import { ROUTES } from '@ledgerly/shared/routes';
import {
  apiErrorCodes,
  ApiErrorResponse,
  CommodityResponseDTO,
  UUID,
} from '@ledgerly/shared/types';
import { CommodityDbRow } from 'src/db/schemas';
import { TestDB } from 'src/db/test-db';
import { compareEntityArrays, parseResponse } from 'src/db/test-utils';
import { Commodity } from 'src/domain';
import { CommodityCode, Id } from 'src/domain/domain-core';
import { createServer } from 'src/presentation/http';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

const url = `/api${ROUTES.commodities}`;

const testUser = {
  email: 'test@example.com',
  name: 'Test User',
  password: 'Password123!',
};

describe('Commodities Integration Tests', () => {
  let testDB: TestDB;
  let server: ReturnType<typeof createServer>;
  let authToken: string;
  let userId: UUID;
  let otherUserId: UUID;

  const activeCommodityData1 = {
    code: CommodityCode.create('USD').valueOf(),
    isTombstone: false,
    name: 'US Dollar',
    precision: 2,
    symbol: '$',
  };

  const activeCommodityData2 = {
    code: CommodityCode.create('EUR').valueOf(),
    isTombstone: false,
    name: 'Euro',
    precision: 2,
    symbol: '€',
  };

  const deletedCommodityData1 = {
    code: CommodityCode.create('GBP').valueOf(),
    isTombstone: true,
    name: 'British Pound',
    precision: 2,
    symbol: '£',
  };

  const activeCommoditiesData = [activeCommodityData1, activeCommodityData2];
  const deletedCommoditiesData = [deletedCommodityData1];
  const allCommoditiesData = [
    ...activeCommoditiesData,
    ...deletedCommoditiesData,
  ];

  let commoditiesDbRows: CommodityDbRow[];

  type AuthorizedRequest = {
    method: 'DELETE' | 'GET' | 'PATCH' | 'POST';
    url: string;
    body?: Record<string, unknown>;
  };

  const injectWithToken = async (token: string, options: AuthorizedRequest) => {
    return await server.inject({
      ...options,
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  };

  const injectAuthorized = async (options: AuthorizedRequest) => {
    return await injectWithToken(authToken, options);
  };

  beforeEach(async () => {
    testDB = new TestDB();
    server = createServer(testDB.db);
    await testDB.setupTestDb();

    await server.ready();

    const user = await testDB.createUser(testUser);

    const token = server.jwt.sign({
      email: user.email,
      userId: user.id,
    });

    authToken = token;

    const decoded = server.jwt.decode(token) as unknown as { userId: UUID };
    userId = Id.restore(decoded.userId).valueOf();

    const otherUser = await testDB.createUser({
      email: 'other@example.com',
      name: 'Other User',
      password: 'Password123!',
    });
    otherUserId = Id.restore(otherUser.id).valueOf();

    commoditiesDbRows = await Promise.all([
      ...allCommoditiesData.map((commodity) =>
        testDB.createCommodity(userId, {
          code: commodity.code,
          isTombstone: commodity.isTombstone,
          name: commodity.name,
          precision: commodity.precision,
          symbol: commodity.symbol,
        }),
      ),
    ]);
  });

  afterEach(async () => {
    await testDB.cleanupTestDb();
  });

  describe('GET /api/commodities', () => {
    let listCommodities: CommodityDbRow[];

    const getWithQueryParamsUrl = (status: CommodityStatusFilterValue) =>
      `${url}?status=${status}`;

    const testCases = [
      {
        description:
          'should return all open commodities by default for the user',
        expectedCommodities: (commodities: CommodityDbRow[]) =>
          commodities.filter(
            (commodity) => !commodity.isClosed && !commodity.isTombstone,
          ),
        query: {},
      },
      {
        description:
          'should return all open commodities when query param status=open',
        expectedCommodities: (commodities: CommodityDbRow[]) =>
          commodities.filter(
            (commodity) => !commodity.isClosed && !commodity.isTombstone,
          ),
        query: { status: 'open' },
      },
      {
        description:
          'should return all commodities including closed when query param status=all',
        expectedCommodities: (commodities: CommodityDbRow[]) =>
          commodities.filter((commodity) => !commodity.isTombstone),
        query: { status: 'all' },
      },
      {
        description:
          'should return all closed commodities when query param status=closed',
        expectedCommodities: (commodities: CommodityDbRow[]) =>
          commodities.filter(
            (commodity) => commodity.isClosed && !commodity.isTombstone,
          ),
        query: { status: 'closed' },
      },
    ] satisfies {
      description: string;
      expectedCommodities: (commodities: CommodityDbRow[]) => CommodityDbRow[];
      query: Partial<{ status: CommodityStatusFilterValue }>;
    }[];

    beforeEach(async () => {
      const closedCommodity = await testDB.createCommodity(userId, {
        code: CommodityCode.create('CHF').valueOf(),
        isClosed: true,
        isTombstone: false,
        name: 'Swiss Franc',
        precision: 2,
        symbol: 'CHF',
      });

      listCommodities = [...commoditiesDbRows, closedCommodity];
    });

    testCases.forEach(({ description, expectedCommodities, query }) => {
      it(description, async () => {
        const queryString = query.status
          ? new URLSearchParams({ status: query.status }).toString()
          : '';
        const requestUrl = queryString ? `${url}?${queryString}` : url;

        const response = await injectAuthorized({
          method: 'GET',
          url: requestUrl,
        });

        expect(response.statusCode).toBe(200);

        const responseCommodities =
          parseResponse<CommodityResponseDTO[]>(response);

        compareEntityArrays(
          expectedCommodities(listCommodities),
          responseCommodities,
        );
      });
    });

    it('should return 400 for invalid status query parameter', async () => {
      const response = await injectAuthorized({
        method: 'GET',
        url: `${url}?status=invalidStatus`,
      });

      expect(response.statusCode).toBe(400);
    });

    it('should not return commodities belonging to another user', async () => {
      const otherUserCommodity = await testDB.createCommodity(otherUserId, {
        code: CommodityCode.create('JPY').valueOf(),
        isTombstone: false,
        name: 'Japanese Yen',
        precision: 2,
        symbol: '¥',
      });

      const response = await injectAuthorized({
        method: 'GET',
        url: getWithQueryParamsUrl('all'),
      });

      expect(response.statusCode).toBe(200);

      const parsedResponse = parseResponse<CommodityResponseDTO[]>(response);

      parsedResponse.forEach((commodity) => {
        expect(commodity.code).not.toBe(otherUserCommodity.code);
      });

      compareEntityArrays(
        listCommodities.filter((commodity) => !commodity.isTombstone),
        parsedResponse,
      );
    });

    it('should return 401 without authorization', async () => {
      const response = await server.inject({
        method: 'GET',
        url: getWithQueryParamsUrl('all'),
      });

      expect(response.statusCode).toBe(401);
    });
  });

  describe('GET /api/commodities/:id', () => {
    it('should return a commodity by id for the authenticated user', async () => {
      const testActiveCommodityDbRow = commoditiesDbRows[0];

      const response = await injectAuthorized({
        method: 'GET',
        url: `${url}/${testActiveCommodityDbRow.id}`,
      });

      expect(response.statusCode).toBe(200);

      const parsedResponse = parseResponse<CommodityResponseDTO>(response);

      expect(parsedResponse).toEqual(
        expect.objectContaining({
          code: testActiveCommodityDbRow.code,
          isTombstone: testActiveCommodityDbRow.isTombstone,
          name: testActiveCommodityDbRow.name,
          precision: testActiveCommodityDbRow.precision,
          symbol: testActiveCommodityDbRow.symbol,
        }),
      );
    });

    it('should return 404 when the commodity is deleted', async () => {
      const tombstoneCommodityRecord = commoditiesDbRows.find(
        (commodity) => commodity.isTombstone,
      );

      if (!tombstoneCommodityRecord) {
        throw new Error('No deleted commodity found in the test data.');
      }

      const response = await injectAuthorized({
        method: 'GET',
        url: `${url}/${tombstoneCommodityRecord.id}`,
      });

      expect(response.statusCode).toBe(404);
    });

    it('should return 404 when the commodity does not exist', async () => {
      const response = await injectAuthorized({
        method: 'GET',
        url: `${url}/${Id.create().valueOf()}`, // Random UUID that doesn't exist
      });

      expect(response.statusCode).toBe(404);
    });

    it('should return 404 when the commodity belongs to another user', async () => {
      const otherUserCommodity = await testDB.createCommodity(otherUserId, {
        code: CommodityCode.create('JPY').valueOf(),
        isTombstone: false,
        name: 'Japanese Yen',
        precision: 2,
        symbol: '¥',
      });

      const response = await injectAuthorized({
        method: 'GET',
        url: `${url}/${otherUserCommodity.id}`,
      });

      expect(response.statusCode).toBe(404);
    });

    it('should return 400 when the commodity id is invalid', async () => {
      const response = await injectAuthorized({
        method: 'GET',
        url: `${url}/invalid-id`,
      });

      expect(response.statusCode).toBe(400);
    });

    it('should return 401 without authorization', async () => {
      const testActiveCommodityDbRow = commoditiesDbRows[0];

      const response = await server.inject({
        method: 'GET',
        url: `${url}/${testActiveCommodityDbRow.id}`,
      });

      expect(response.statusCode).toBe(401);
    });
  });

  describe('POST /api/commodities', () => {
    it('should create a commodity for the authenticated user', async () => {
      const createCommodityData = {
        code: CommodityCode.create('CHF').valueOf(),
        name: 'Swiss Franc',
        precision: 2,
        symbol: 'CHF',
      };

      const response = await injectAuthorized({
        body: createCommodityData,
        method: 'POST',
        url,
      });

      expect(response.statusCode).toBe(201);

      const parsedResponse = parseResponse<CommodityResponseDTO>(response);

      expect(parsedResponse).toEqual(
        expect.objectContaining({
          ...createCommodityData,
          isTombstone: false,
          userId,
        }),
      );
    });

    it('should create a commodity with default precision and null symbol', async () => {
      const createCommodityData = {
        code: CommodityCode.create('CAD').valueOf(),
        name: 'Canadian Dollar',
      };

      const response = await injectAuthorized({
        body: createCommodityData,
        method: 'POST',
        url,
      });

      expect(response.statusCode).toBe(201);

      const parsedResponse = parseResponse<CommodityResponseDTO>(response);

      expect(parsedResponse).toEqual(
        expect.objectContaining({
          ...createCommodityData,
          isTombstone: false,
          precision: Commodity.DEFAULT_PRECISION,
          symbol: Commodity.DEFAULT_SYMBOL,
          userId,
        }),
      );
    });

    it('should reject duplicate code for the same user', async () => {
      const response = await injectAuthorized({
        body: {
          code: activeCommodityData1.code,
          name: 'Duplicate US Dollar',
          precision: 2,
          symbol: '$',
        },
        method: 'POST',
        url,
      });

      expect(response.statusCode).toBe(409);
    });

    it('should allow the same code for different users', async () => {
      const otherUserToken = server.jwt.sign({
        email: 'other@example.com',
        userId: otherUserId,
      });

      const response = await injectWithToken(otherUserToken, {
        body: {
          code: activeCommodityData1.code,
          name: 'Other User Dollar',
          precision: 2,
          symbol: '$',
        },
        method: 'POST',
        url,
      });

      expect(response.statusCode).toBe(201);

      const parsedResponse = parseResponse<CommodityResponseDTO>(response);

      expect(parsedResponse).toEqual(
        expect.objectContaining({
          code: activeCommodityData1.code,
          userId: otherUserId,
        }),
      );
    });

    it('should return 400 for invalid payload', async () => {
      const response = await injectAuthorized({
        body: {
          code: '1',
          precision: 19,
          symbol: 'symbol-is-too-long',
        },
        method: 'POST',
        url,
      });

      expect(response.statusCode).toBe(400);
    });

    it('should return 401 without authorization', async () => {
      const response = await server.inject({
        body: {
          code: CommodityCode.create('AUD').valueOf(),
          name: 'Australian Dollar',
        },
        method: 'POST',
        url,
      });

      expect(response.statusCode).toBe(401);
    });
  });

  describe('PATCH /api/commodities/:id', () => {
    it('should update editable commodity metadata', async () => {
      const commodityToUpdate = commoditiesDbRows[0];

      const updateData = {
        code: CommodityCode.create('USDX').valueOf(),
        name: 'Updated US Dollar',
        symbol: 'US$',
      };

      const response = await injectAuthorized({
        body: updateData,
        method: 'PATCH',
        url: `${url}/${commodityToUpdate.id}`,
      });

      expect(response.statusCode).toBe(200);

      const parsedResponse = parseResponse<CommodityResponseDTO>(response);

      expect(typeof parsedResponse.updatedAt).toBe('string');

      expect(parsedResponse).toEqual(
        expect.objectContaining({
          ...updateData,
          createdAt: commodityToUpdate.createdAt,
          id: commodityToUpdate.id,
          isTombstone: false,
          precision: commodityToUpdate.precision,
          userId,
        }),
      );
    });

    it('should reject duplicate code for the same user', async () => {
      const commodityToUpdate = commoditiesDbRows[0];

      const response = await injectAuthorized({
        body: {
          code: activeCommodityData2.code,
        },
        method: 'PATCH',
        url: `${url}/${commodityToUpdate.id}`,
      });

      expect(response.statusCode).toBe(409);
    });

    it('should allow updating to a code used by another user', async () => {
      await testDB.createCommodity(otherUserId, {
        code: CommodityCode.create('JPY').valueOf(),
        name: 'Japanese Yen',
        precision: 2,
        symbol: '¥',
      });

      const commodityToUpdate = commoditiesDbRows[0];

      const response = await injectAuthorized({
        body: {
          code: CommodityCode.create('JPY').valueOf(),
        },
        method: 'PATCH',
        url: `${url}/${commodityToUpdate.id}`,
      });

      expect(response.statusCode).toBe(200);

      const parsedResponse = parseResponse<CommodityResponseDTO>(response);

      expect(parsedResponse).toEqual(
        expect.objectContaining({
          code: CommodityCode.create('JPY').valueOf(),
          id: commodityToUpdate.id,
          userId,
        }),
      );
    });

    it('should return 404 when updating another user commodity', async () => {
      const otherUserCommodity = await testDB.createCommodity(otherUserId, {
        code: CommodityCode.create('JPY').valueOf(),
        name: 'Japanese Yen',
        precision: 2,
        symbol: '¥',
      });

      const response = await injectAuthorized({
        body: {
          name: 'Updated Japanese Yen',
        },
        method: 'PATCH',
        url: `${url}/${otherUserCommodity.id}`,
      });

      expect(response.statusCode).toBe(404);
    });

    it('should return 404 when updating a deleted commodity', async () => {
      const deletedCommodity = commoditiesDbRows.find(
        (commodity) => commodity.isTombstone,
      );

      if (!deletedCommodity) {
        throw new Error('No deleted commodity found in the test data.');
      }

      const response = await injectAuthorized({
        body: {
          name: 'Updated British Pound',
        },
        method: 'PATCH',
        url: `${url}/${deletedCommodity.id}`,
      });

      expect(response.statusCode).toBe(404);
    });

    it('should return 400 for invalid params', async () => {
      const response = await injectAuthorized({
        body: {
          name: 'Updated Commodity',
        },
        method: 'PATCH',
        url: `${url}/invalid-id`,
      });

      expect(response.statusCode).toBe(400);
    });

    it('should return 400 for invalid payload', async () => {
      const commodityToUpdate = commoditiesDbRows[0];

      const response = await injectAuthorized({
        body: {
          code: '1',
          precision: 3,
        },
        method: 'PATCH',
        url: `${url}/${commodityToUpdate.id}`,
      });

      expect(response.statusCode).toBe(400);
    });

    it('should return 401 without authorization', async () => {
      const commodityToUpdate = commoditiesDbRows[0];

      const response = await server.inject({
        body: {
          name: 'Updated Commodity',
        },
        method: 'PATCH',
        url: `${url}/${commodityToUpdate.id}`,
      });

      expect(response.statusCode).toBe(401);
    });

    it("should not allow updating the commodity's precision", async () => {
      const commodityToUpdate = commoditiesDbRows[0];

      const response = await injectAuthorized({
        body: {
          precision: 5,
        },
        method: 'PATCH',
        url: `${url}/${commodityToUpdate.id}`,
      });

      expect(response.statusCode).toBe(200);

      const parsedResponse = parseResponse<CommodityResponseDTO>(response);

      expect(parsedResponse.precision).toBe(commodityToUpdate.precision);
    });
  });

  describe('POST /api/commodities/:id/close', () => {
    it('should return 200 and close an open commodity by id', async () => {
      const commodityToClose = commoditiesDbRows.find(
        (commodity) => !commodity.isClosed && !commodity.isTombstone,
      );

      if (!commodityToClose) {
        throw new Error('No open commodity found in the test data.');
      }

      const response = await injectAuthorized({
        method: 'POST',
        url: `${url}/${commodityToClose.id}/close`,
      });

      const responseBody = parseResponse<CommodityResponseDTO>(response);

      expect(response.statusCode).toBe(200);
      expect(responseBody).toMatchObject({
        id: commodityToClose.id,
        isClosed: true,
      });

      const closedCommodity = await testDB.getCommodityById(
        commodityToClose.id,
      );

      expect(closedCommodity?.isClosed).toBe(true);
    });

    it('should be idempotent for an already closed commodity', async () => {
      const closedCommodity = await testDB.createCommodity(userId, {
        code: CommodityCode.create('CHF').valueOf(),
        isClosed: true,
        isTombstone: false,
        name: 'Swiss Franc',
        precision: 2,
        symbol: 'CHF',
      });

      const response = await injectAuthorized({
        method: 'POST',
        url: `${url}/${closedCommodity.id}/close`,
      });

      const responseBody = parseResponse<CommodityResponseDTO>(response);

      expect(response.statusCode).toBe(200);
      expect(responseBody).toMatchObject({
        id: closedCommodity.id,
        isClosed: true,
      });

      const retrievedCommodity = await testDB.getCommodityById(
        closedCommodity.id,
      );

      expect(retrievedCommodity?.isClosed).toBe(true);
      expect(retrievedCommodity?.updatedAt).toBe(closedCommodity.updatedAt);
    });

    it('should return 404 when closing another user commodity', async () => {
      const otherUserCommodity = await testDB.createCommodity(otherUserId, {
        code: CommodityCode.create('JPY').valueOf(),
        name: 'Japanese Yen',
        precision: 2,
        symbol: '¥',
      });

      const response = await injectAuthorized({
        method: 'POST',
        url: `${url}/${otherUserCommodity.id}/close`,
      });

      expect(response.statusCode).toBe(404);
    });

    it('should return 404 when closing a deleted commodity', async () => {
      const deletedCommodity = commoditiesDbRows.find(
        (commodity) => commodity.isTombstone,
      );

      if (!deletedCommodity) {
        throw new Error('No deleted commodity found in the test data.');
      }

      const response = await injectAuthorized({
        method: 'POST',
        url: `${url}/${deletedCommodity.id}/close`,
      });

      expect(response.statusCode).toBe(404);
    });

    it('should return 400 when the commodity id is invalid', async () => {
      const response = await injectAuthorized({
        method: 'POST',
        url: `${url}/invalid-id/close`,
      });

      expect(response.statusCode).toBe(400);
    });

    it('should return 401 without authorization', async () => {
      const commodityToClose = commoditiesDbRows[0];

      const response = await server.inject({
        method: 'POST',
        url: `${url}/${commodityToClose.id}/close`,
      });

      expect(response.statusCode).toBe(401);
    });
  });

  describe('POST /api/commodities/:id/open', () => {
    it('should return 200 and open a closed commodity by id', async () => {
      const commodityToOpen = await testDB.createCommodity(userId, {
        code: CommodityCode.create('CHF').valueOf(),
        isClosed: true,
        isTombstone: false,
        name: 'Swiss Franc',
        precision: 2,
        symbol: 'CHF',
      });

      const response = await injectAuthorized({
        method: 'POST',
        url: `${url}/${commodityToOpen.id}/open`,
      });

      const responseBody = parseResponse<CommodityResponseDTO>(response);

      expect(response.statusCode).toBe(200);
      expect(responseBody).toMatchObject({
        id: commodityToOpen.id,
        isClosed: false,
      });

      const openedCommodity = await testDB.getCommodityById(commodityToOpen.id);

      expect(openedCommodity?.isClosed).toBe(false);
    });

    it('should be idempotent for an already open commodity', async () => {
      const openCommodity = commoditiesDbRows.find(
        (commodity) => !commodity.isClosed && !commodity.isTombstone,
      );

      if (!openCommodity) {
        throw new Error('No open commodity found in the test data.');
      }

      const response = await injectAuthorized({
        method: 'POST',
        url: `${url}/${openCommodity.id}/open`,
      });

      const responseBody = parseResponse<CommodityResponseDTO>(response);

      expect(response.statusCode).toBe(200);
      expect(responseBody).toMatchObject({
        id: openCommodity.id,
        isClosed: false,
      });

      const retrievedCommodity = await testDB.getCommodityById(
        openCommodity.id,
      );

      expect(retrievedCommodity?.isClosed).toBe(false);
      expect(retrievedCommodity?.updatedAt).toBe(openCommodity.updatedAt);
    });

    it('should return 404 when opening another user commodity', async () => {
      const otherUserCommodity = await testDB.createCommodity(otherUserId, {
        code: CommodityCode.create('JPY').valueOf(),
        isClosed: true,
        name: 'Japanese Yen',
        precision: 2,
        symbol: '¥',
      });

      const response = await injectAuthorized({
        method: 'POST',
        url: `${url}/${otherUserCommodity.id}/open`,
      });

      expect(response.statusCode).toBe(404);
    });

    it('should return 404 when opening a deleted commodity', async () => {
      const deletedCommodity = commoditiesDbRows.find(
        (commodity) => commodity.isTombstone,
      );

      if (!deletedCommodity) {
        throw new Error('No deleted commodity found in the test data.');
      }

      const response = await injectAuthorized({
        method: 'POST',
        url: `${url}/${deletedCommodity.id}/open`,
      });

      expect(response.statusCode).toBe(404);
    });

    it('should return 400 when the commodity id is invalid', async () => {
      const response = await injectAuthorized({
        method: 'POST',
        url: `${url}/invalid-id/open`,
      });

      expect(response.statusCode).toBe(400);
    });

    it('should return 401 without authorization', async () => {
      const commodityToOpen = commoditiesDbRows[0];

      const response = await server.inject({
        method: 'POST',
        url: `${url}/${commodityToOpen.id}/open`,
      });

      expect(response.statusCode).toBe(401);
    });
  });

  describe('DELETE /api/commodities/:id', () => {
    it('should delete a commodity by id', async () => {
      const commodityToDelete = commoditiesDbRows[0];

      const response = await injectAuthorized({
        method: 'DELETE',
        url: `${url}/${commodityToDelete.id}`,
      });

      expect(response.statusCode).toBe(204);

      const getResponse = await injectAuthorized({
        method: 'GET',
        url: `${url}/${commodityToDelete.id}`,
      });

      expect(getResponse.statusCode).toBe(404);

      const allCommodities = await testDB.getAllCommoditiesByUserId(userId);

      const deletedCommoditiesDbRows = allCommodities.filter(
        (commodity) => commodity.isTombstone,
      );

      const allActiveCommodities = allCommodities.filter(
        (commodity) => !commodity.isTombstone,
      );

      expect(allActiveCommodities).toHaveLength(
        activeCommoditiesData.length - 1,
      );

      expect(deletedCommoditiesDbRows).toHaveLength(
        deletedCommoditiesData.length + 1,
      );
    });

    it('should return 404 when reading a deleted commodity by id', async () => {
      const deletedCommodity = commoditiesDbRows.find(
        (commodity) => commodity.isTombstone,
      );

      if (!deletedCommodity) {
        throw new Error('No deleted commodity found in the test data.');
      }

      const response = await injectAuthorized({
        method: 'GET',
        url: `${url}/${deletedCommodity.id}`,
      });

      expect(response.statusCode).toBe(404);
    });

    it('should not return the deleted commodity in the list', async () => {
      const commodityToDelete = commoditiesDbRows[0];

      const deleteResponse = await injectAuthorized({
        method: 'DELETE',
        url: `${url}/${commodityToDelete.id}`,
      });

      expect(deleteResponse.statusCode).toBe(204);

      const listResponse = await injectAuthorized({
        method: 'GET',
        url: `${url}?status=all`,
      });

      expect(listResponse.statusCode).toBe(200);

      const parsedListResponse =
        parseResponse<CommodityResponseDTO[]>(listResponse);

      expect(parsedListResponse).toHaveLength(activeCommoditiesData.length - 1);

      parsedListResponse.forEach((commodity) => {
        expect(commodity.id).not.toBe(commodityToDelete.id);
        expect(commodity.isTombstone).toBe(false);
      });
    });

    it('should return 404 when deleting another user commodity', async () => {
      const otherUserCommodity = await testDB.createCommodity(otherUserId, {
        code: CommodityCode.create('JPY').valueOf(),
        name: 'Japanese Yen',
        precision: 2,
        symbol: '¥',
      });

      const response = await injectAuthorized({
        method: 'DELETE',
        url: `${url}/${otherUserCommodity.id}`,
      });

      expect(response.statusCode).toBe(404);
    });

    it('should return 409 when deleting a commodity with active account references', async () => {
      const referencedCommodity = await testDB.createCommodity(userId, {
        code: CommodityCode.create('CHF').valueOf(),
        name: 'Swiss Franc',
        precision: 2,
        symbol: 'CHF',
      });
      await testDB.createAccount(userId, referencedCommodity.id);

      const response = await injectAuthorized({
        method: 'DELETE',
        url: `${url}/${referencedCommodity.id}`,
      });

      const parsedResponse = parseResponse<ApiErrorResponse>(response);

      expect(response.statusCode).toBe(409);
      expect(parsedResponse).toEqual({
        code: apiErrorCodes.commodityHasActiveReferences,
        context: { commodityId: referencedCommodity.id },
        error: true,
      });

      const retrievedCommodity = await testDB.getCommodityById(
        referencedCommodity.id,
      );

      expect(retrievedCommodity?.isTombstone).toBe(false);
    });

    it('should return 409 when deleting a commodity with active transaction references', async () => {
      const referencedCommodity = await testDB.createCommodity(userId, {
        code: CommodityCode.create('CHF').valueOf(),
        name: 'Swiss Franc',
        precision: 2,
        symbol: 'CHF',
      });

      await testDB.createTransaction(userId, referencedCommodity.id);

      const response = await injectAuthorized({
        method: 'DELETE',
        url: `${url}/${referencedCommodity.id}`,
      });

      const parsedResponse = parseResponse<ApiErrorResponse>(response);

      expect(response.statusCode).toBe(409);
      expect(parsedResponse).toEqual({
        code: apiErrorCodes.commodityHasActiveReferences,
        context: { commodityId: referencedCommodity.id },
        error: true,
      });

      const retrievedCommodity = await testDB.getCommodityById(
        referencedCommodity.id,
      );

      expect(retrievedCommodity?.isTombstone).toBe(false);
    });

    it('should return 204 when deleting an already deleted commodity', async () => {
      const deletedCommodity = commoditiesDbRows.find(
        (commodity) => commodity.isTombstone,
      );

      if (!deletedCommodity) {
        throw new Error('No deleted commodity found in the test data.');
      }

      const response = await injectAuthorized({
        method: 'DELETE',
        url: `${url}/${deletedCommodity.id}`,
      });

      expect(response.statusCode).toBe(204);
    });

    it('should return 400 when the commodity id is invalid', async () => {
      const response = await injectAuthorized({
        method: 'DELETE',
        url: `${url}/invalid-id`,
      });

      expect(response.statusCode).toBe(400);
    });

    it('should return 401 without authorization', async () => {
      const commodityToDelete = commoditiesDbRows[0];

      const response = await server.inject({
        method: 'DELETE',
        url: `${url}/${commodityToDelete.id}`,
      });

      expect(response.statusCode).toBe(401);
    });
  });
});
