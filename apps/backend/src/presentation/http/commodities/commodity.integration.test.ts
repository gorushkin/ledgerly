import { ROUTES } from '@ledgerly/shared/routes';
import { CommodityResponseDTO, UUID } from '@ledgerly/shared/types';
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

  const archivedCommodityData1 = {
    code: CommodityCode.create('GBP').valueOf(),
    isTombstone: true,
    name: 'British Pound',
    precision: 2,
    symbol: '£',
  };

  const activeCommoditiesData = [activeCommodityData1, activeCommodityData2];
  const archivedCommoditiesData = [archivedCommodityData1];
  const allCommoditiesData = [
    ...activeCommoditiesData,
    ...archivedCommoditiesData,
  ];

  let commoditiesDbRows: CommodityDbRow[];

  type AuthorizedRequest = {
    method: 'DELETE' | 'GET' | 'POST' | 'PUT';
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
    it('should return all active commodities for the authenticated user when no status is provided', async () => {
      const response = await injectAuthorized({
        method: 'GET',
        url,
      });

      expect(response.statusCode).toBe(200);

      const parsedResponse = parseResponse<CommodityResponseDTO[]>(response);

      expect(parsedResponse).toHaveLength(activeCommoditiesData.length);

      compareEntityArrays(activeCommoditiesData, parsedResponse);
    });

    it('should return active commodities when status=active is provided', async () => {
      const response = await injectAuthorized({
        method: 'GET',
        url: `${url}?status=active`,
      });

      expect(response.statusCode).toBe(200);

      const parsedResponse = parseResponse<CommodityResponseDTO[]>(response);

      expect(parsedResponse).toHaveLength(activeCommoditiesData.length);

      compareEntityArrays(activeCommoditiesData, parsedResponse);
    });

    it('should return archived commodities when status=archived is provided', async () => {
      const response = await injectAuthorized({
        method: 'GET',
        url: `${url}?status=archived`,
      });

      expect(response.statusCode).toBe(200);

      const parsedResponse = parseResponse<CommodityResponseDTO[]>(response);

      expect(parsedResponse).toHaveLength(1);

      compareEntityArrays([archivedCommodityData1], parsedResponse);
    });

    it('should return all commodities when status=all is provided', async () => {
      const response = await injectAuthorized({
        method: 'GET',
        url: `${url}?status=all`,
      });

      expect(response.statusCode).toBe(200);

      const parsedResponse = parseResponse<CommodityResponseDTO[]>(response);

      expect(parsedResponse).toHaveLength(
        activeCommoditiesData.length + 1, // +1 for the archived commodity
      );

      compareEntityArrays(
        [...activeCommoditiesData, archivedCommodityData1],
        parsedResponse,
      );
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
        url: `${url}?status=all`,
      });

      expect(response.statusCode).toBe(200);

      const parsedResponse = parseResponse<CommodityResponseDTO[]>(response);

      parsedResponse.forEach((commodity) => {
        expect(commodity.code).not.toBe(otherUserCommodity.code);
      });

      expect(parsedResponse).toHaveLength(allCommoditiesData.length);

      compareEntityArrays(allCommoditiesData, parsedResponse);
    });

    it('should return 401 without authorization', async () => {
      const response = await server.inject({
        method: 'GET',
        url: `${url}?status=all`,
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

    it('should return an archived commodity by id marked as archived', async () => {
      const testArchivedCommodityDbRow = commoditiesDbRows.find(
        (commodity) => commodity.isTombstone,
      );

      if (!testArchivedCommodityDbRow) {
        throw new Error('No archived commodity found in the test data.');
      }

      const response = await injectAuthorized({
        method: 'GET',
        url: `${url}/${testArchivedCommodityDbRow.id}`,
      });

      expect(response.statusCode).toBe(200);

      const parsedResponse = parseResponse<CommodityResponseDTO>(response);

      expect(parsedResponse).toEqual(
        expect.objectContaining({
          code: testArchivedCommodityDbRow.code,
          isTombstone: testArchivedCommodityDbRow.isTombstone,
          name: testArchivedCommodityDbRow.name,
          precision: testArchivedCommodityDbRow.precision,
          symbol: testArchivedCommodityDbRow.symbol,
        }),
      );
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

  describe('PUT /api/commodities/:id', () => {
    it('should update editable commodity metadata', async () => {
      const commodityToUpdate = commoditiesDbRows[0];

      const updateData = {
        code: CommodityCode.create('USDX').valueOf(),
        name: 'Updated US Dollar',
        symbol: 'US$',
      };

      const response = await injectAuthorized({
        body: updateData,
        method: 'PUT',
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
        method: 'PUT',
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
        method: 'PUT',
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
        method: 'PUT',
        url: `${url}/${otherUserCommodity.id}`,
      });

      expect(response.statusCode).toBe(404);
    });

    it('should return 404 when updating an archived commodity', async () => {
      const archivedCommodity = commoditiesDbRows.find(
        (commodity) => commodity.isTombstone,
      );

      if (!archivedCommodity) {
        throw new Error('No archived commodity found in the test data.');
      }

      const response = await injectAuthorized({
        body: {
          name: 'Updated British Pound',
        },
        method: 'PUT',
        url: `${url}/${archivedCommodity.id}`,
      });

      expect(response.statusCode).toBe(404);
    });

    it('should return 400 for invalid params', async () => {
      const response = await injectAuthorized({
        body: {
          name: 'Updated Commodity',
        },
        method: 'PUT',
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
        method: 'PUT',
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
        method: 'PUT',
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
        method: 'PUT',
        url: `${url}/${commodityToUpdate.id}`,
      });

      expect(response.statusCode).toBe(200);

      const parsedResponse = parseResponse<CommodityResponseDTO>(response);

      expect(parsedResponse.precision).toBe(commodityToUpdate.precision);
    });
  });

  describe('DELETE /api/commodities/:id', () => {
    it('should archive a commodity by id', async () => {
      const commodityToArchive = commoditiesDbRows[0];

      const response = await injectAuthorized({
        method: 'DELETE',
        url: `${url}/${commodityToArchive.id}`,
      });

      expect(response.statusCode).toBe(204);

      const getResponse = await injectAuthorized({
        method: 'GET',
        url: `${url}/${commodityToArchive.id}`,
      });

      expect(getResponse.statusCode).toBe(200);

      const parsedGetResponse =
        parseResponse<CommodityResponseDTO>(getResponse);

      expect(parsedGetResponse).toEqual(
        expect.objectContaining({
          id: commodityToArchive.id,
          isTombstone: true,
        }),
      );

      const allCommodities = await testDB.getAllCommoditiesByUserId(userId);

      const archivedCommoditiesDbRows = allCommodities.filter(
        (commodity) => commodity.isTombstone,
      );

      const allActiveCommodities = allCommodities.filter(
        (commodity) => !commodity.isTombstone,
      );

      expect(allActiveCommodities).toHaveLength(
        activeCommoditiesData.length - 1,
      );

      expect(archivedCommoditiesDbRows).toHaveLength(
        archivedCommoditiesData.length + 1,
      );
    });

    it('should leave the archived commodity readable by id', async () => {
      const archivedCommodity = commoditiesDbRows.find(
        (commodity) => commodity.isTombstone,
      );

      if (!archivedCommodity) {
        throw new Error('No archived commodity found in the test data.');
      }

      const response = await injectAuthorized({
        method: 'GET',
        url: `${url}/${archivedCommodity.id}`,
      });

      expect(response.statusCode).toBe(200);

      const parsedResponse = parseResponse<CommodityResponseDTO>(response);

      expect(parsedResponse).toEqual(
        expect.objectContaining({
          id: archivedCommodity.id,
          isTombstone: true,
        }),
      );
    });

    it('should return the archived commodity in the list marked as archived', async () => {
      const commodityToArchive = commoditiesDbRows[0];

      const deleteResponse = await injectAuthorized({
        method: 'DELETE',
        url: `${url}/${commodityToArchive.id}`,
      });

      expect(deleteResponse.statusCode).toBe(204);

      const listResponse = await injectAuthorized({
        method: 'GET',
        url: `${url}?status=archived`,
      });

      expect(listResponse.statusCode).toBe(200);

      const parsedListResponse =
        parseResponse<CommodityResponseDTO[]>(listResponse);

      expect(parsedListResponse).toHaveLength(
        archivedCommoditiesData.length + 1,
      );

      compareEntityArrays(
        [
          archivedCommodityData1,
          {
            code: commodityToArchive.code,
            isTombstone: true,
            name: commodityToArchive.name,
            precision: commodityToArchive.precision,
            symbol: commodityToArchive.symbol,
          },
        ],
        parsedListResponse,
      );
    });

    it('should return 404 when archiving another user commodity', async () => {
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

    it('should return 404 when archiving an already archived commodity', async () => {
      const archivedCommodity = commoditiesDbRows.find(
        (commodity) => commodity.isTombstone,
      );

      if (!archivedCommodity) {
        throw new Error('No archived commodity found in the test data.');
      }

      const response = await injectAuthorized({
        method: 'DELETE',
        url: `${url}/${archivedCommodity.id}`,
      });

      expect(response.statusCode).toBe(404);
    });

    it('should return 400 when the commodity id is invalid', async () => {
      const response = await injectAuthorized({
        method: 'DELETE',
        url: `${url}/invalid-id`,
      });

      expect(response.statusCode).toBe(400);
    });

    it('should return 401 without authorization', async () => {
      const commodityToArchive = commoditiesDbRows[0];

      const response = await server.inject({
        method: 'DELETE',
        url: `${url}/${commodityToArchive.id}`,
      });

      expect(response.statusCode).toBe(401);
    });
  });
});
