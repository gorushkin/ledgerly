import { apiErrorCodes } from '@ledgerly/shared/types';
import { CommodityQuery } from '@ledgerly/shared/validation';
import { type CommodityRepositoryUpdateInput } from 'src/application';
import type { CommodityDbRow } from 'src/db/schemas/commodities';
import { UserDbRow } from 'src/db/schemas/users';
import { compareEntities, compareEntityArrays } from 'src/db/test-utils';
import { CommoditySnapshot } from 'src/domain/commodities/types';
import { CommodityCode, Name, Timestamp } from 'src/domain/domain-core/';
import { Id } from 'src/domain/domain-core/value-objects/Id';
import {
  RecordAlreadyExistsError,
  RepositoryNotFoundError,
} from 'src/infrastructure/errors';
import { describe, vi, beforeEach, it, expect } from 'vitest';

import { TestDB } from '../../../db/test-db';
import { TransactionManager } from '../TransactionManager';

import { CommodityRepository } from './commodity.repository';

describe('CommodityRepository', () => {
  let testDB: TestDB;

  const transactionManager = {
    getCurrentTransaction: () => testDB.db,
    run: vi.fn((cb: () => unknown) => {
      return cb();
    }),
  };

  const commodityRepository = new CommodityRepository(
    transactionManager as unknown as TransactionManager,
  );

  let user: UserDbRow;

  beforeEach(async () => {
    testDB = new TestDB();
    await testDB.setupTestDb();

    user = await testDB.createUser();
  });

  describe('getById', () => {
    let commodityDbRow: CommodityDbRow;

    beforeEach(async () => {
      commodityDbRow = await testDB.createCommodity(user.id);
    });

    it('should return the commodity when it exists', async () => {
      const retrievedCommodity = await commodityRepository.getById(
        user.id,
        commodityDbRow.id,
      );

      expect(retrievedCommodity).toEqual(commodityDbRow);
    });

    it('should throw an error when the commodity does not exist', async () => {
      const nonExistentId = Id.create().valueOf();

      await expect(
        commodityRepository.getById(user.id, nonExistentId),
      ).rejects.toThrowError(RepositoryNotFoundError);
    });

    it('returns an allowlisted error contract for a missing commodity', async () => {
      const nonExistentId = Id.create().valueOf();

      await expect(
        commodityRepository.getById(user.id, nonExistentId),
      ).rejects.toMatchObject({
        code: apiErrorCodes.entityNotFound,
        context: { entityId: nonExistentId, entityType: 'commodity' },
      });
    });

    it('should throw an error when the commodity belongs to a different user', async () => {
      const anotherUser = await testDB.createUser();

      await expect(
        commodityRepository.getById(anotherUser.id, commodityDbRow.id),
      ).rejects.toThrowError(RepositoryNotFoundError);
    });
  });

  describe('getAll', () => {
    const commoditiesDataList = [
      {
        code: CommodityCode.create('TOMB').valueOf(),
        isClosed: false,
        isTombstone: true,
        name: 'Tombstoned Commodity',
      },
      {
        code: CommodityCode.create('OPEN').valueOf(),
        isClosed: false,
        isTombstone: false,
        name: 'Open Commodity',
      },
      {
        code: CommodityCode.create('CLOSED').valueOf(),
        isClosed: true,
        isTombstone: false,
        name: 'Closed Commodity',
      },
    ];

    const allCommodities = commoditiesDataList.filter(
      (commodity) => !commodity.isTombstone,
    );

    const openCommodities = commoditiesDataList.filter(
      (commodity) => !commodity.isClosed && !commodity.isTombstone,
    );

    const closedCommodities = commoditiesDataList.filter(
      (commodity) => commodity.isClosed && !commodity.isTombstone,
    );

    type TestData = {
      code: string;
      isClosed: boolean;
      isTombstone: boolean;
      name: string;
    };

    const testData: [CommodityQuery, TestData[]][] = [
      [{ status: 'all' }, allCommodities],
      [{ status: 'open' }, openCommodities],
      [{ status: 'closed' }, closedCommodities],
    ];

    beforeEach(async () => {
      for (const data of commoditiesDataList) {
        await testDB.createCommodity(user.id, {
          code: data.code,
          isClosed: data.isClosed,
          isTombstone: data.isTombstone,
          name: data.name,
        });
      }
    });

    it.each(testData)(
      'returns commodities matching query %s',
      async ({ status }: CommodityQuery, expectedCommodities: TestData[]) => {
        const commodities = await commodityRepository.getAll(user.id, {
          status,
        });

        compareEntityArrays(commodities, expectedCommodities, {
          fields: ['code', 'name', 'isClosed', 'isTombstone'],
        });

        expect(commodities.length).toBe(expectedCommodities.length);
      },
    );

    it('should return an empty array when the user has no commodities', async () => {
      const anotherUser = await testDB.createUser();

      const commodities = await commodityRepository.getAll(anotherUser.id, {
        status: 'open',
      });

      expect(commodities).toEqual([]);
    });

    it.each<CommodityQuery>([
      { status: 'open' },
      { status: 'closed' },
      { status: 'all' },
    ])(
      'should not return commodities belonging to other users for $status.status status',
      async ({ status }) => {
        const anotherUser = await testDB.createUser();
        await testDB.createCommodity(anotherUser.id, {
          code: CommodityCode.create('OTHER').valueOf(),
          isClosed: status === 'closed',
          name: 'Other User Commodity',
        });

        const commodities = await commodityRepository.getAll(user.id, {
          status,
        });

        const expectedCommodities =
          status === 'all'
            ? allCommodities
            : status === 'open'
              ? openCommodities
              : closedCommodities;

        compareEntityArrays(commodities, expectedCommodities, {
          fields: ['code', 'name', 'isClosed', 'isTombstone'],
        });
      },
    );
  });

  describe('create', () => {
    it('should create a new commodity for the user', async () => {
      const newCommodityData: CommoditySnapshot = {
        code: CommodityCode.create('NEW').valueOf(),
        createdAt: Timestamp.create().valueOf(),
        id: Id.create().valueOf(),
        isClosed: false,
        isTombstone: false,
        name: Name.create('New Commodity').valueOf(),
        precision: 2,
        symbol: 'N',
        updatedAt: Timestamp.create().valueOf(),
        userId: user.id,
      };

      const createdCommodity = await commodityRepository.create(
        user.id,
        newCommodityData,
      );

      expect(createdCommodity).toMatchObject(newCommodityData);

      const retrievedCommodity = await commodityRepository.getById(
        user.id,
        createdCommodity.id,
      );

      expect(retrievedCommodity).toEqual(createdCommodity);
    });

    it('should throw an error when trying to create a commodity with an existing CommodityCode', async () => {
      const createdCommodity = await testDB.createCommodity(user.id);

      const newCommodityData: CommoditySnapshot = {
        code: createdCommodity.code,
        createdAt: Timestamp.create().valueOf(),
        id: Id.create().valueOf(),
        isClosed: false,
        isTombstone: false,
        name: Name.create('Duplicate Commodity').valueOf(),
        precision: 2,
        symbol: 'D',
        updatedAt: Timestamp.create().valueOf(),
        userId: user.id,
      };

      await expect(
        commodityRepository.create(user.id, newCommodityData),
      ).rejects.toThrowError(
        new RecordAlreadyExistsError({
          context: {
            field: 'code',
            tableName: 'commodities',
            value: newCommodityData.code,
          },
        }),
      );
    });

    it('should allow creating commodities with the same CommodityCode for different users', async () => {
      const createdCommodity = await testDB.createCommodity(user.id);

      const anotherUser = await testDB.createUser();

      const newCommodityData: CommoditySnapshot = {
        code: createdCommodity.code,
        createdAt: Timestamp.create().valueOf(),
        id: Id.create().valueOf(),
        isClosed: false,
        isTombstone: false,
        name: Name.create('Same Code Commodity').valueOf(),
        precision: 2,
        symbol: 'S',
        updatedAt: Timestamp.create().valueOf(),
        userId: anotherUser.id,
      };

      const createdCommodityForAnotherUser = await commodityRepository.create(
        anotherUser.id,
        newCommodityData,
      );

      expect(createdCommodityForAnotherUser).toMatchObject(newCommodityData);

      const retrievedCommodity = await commodityRepository.getById(
        anotherUser.id,
        createdCommodityForAnotherUser.id,
      );

      expect(retrievedCommodity).toEqual(createdCommodityForAnotherUser);
    });
  });

  describe('update', () => {
    let commodityDbRow: CommodityDbRow;

    beforeEach(async () => {
      commodityDbRow = await testDB.createCommodity(user.id);
    });

    it('should update the commodity when it exists', async () => {
      const updatedData: Partial<CommoditySnapshot> = {
        code: CommodityCode.create('UPD').valueOf(),
        name: Name.create('Updated Commodity').valueOf(),
        updatedAt: Timestamp.create().valueOf(),
      };

      const updatedCommodity = await commodityRepository.update(
        user.id,
        commodityDbRow.id,
        { ...commodityDbRow, ...updatedData },
      );

      expect(updatedCommodity.name).toEqual(updatedData.name);
      expect(updatedCommodity.code).toEqual(updatedData.code);
      expect(updatedCommodity.updatedAt).toEqual(updatedData.updatedAt);

      const retrievedCommodity = await commodityRepository.getById(
        user.id,
        commodityDbRow.id,
      );

      expect(retrievedCommodity).toEqual(updatedCommodity);
    });

    it('should throw an error when the commodity does not exist', async () => {
      const nonExistentId = Id.create().valueOf();

      const updatedData: CommodityRepositoryUpdateInput = {
        code: CommodityCode.create('UPD').valueOf(),
        name: Name.create('Updated Commodity').valueOf(),
        updatedAt: Timestamp.create().valueOf(),
      };

      await expect(
        commodityRepository.update(user.id, nonExistentId, updatedData),
      ).rejects.toThrowError(RepositoryNotFoundError);
    });

    it('should partially update only the provided fields', async () => {
      const updatedData: CommodityRepositoryUpdateInput = {
        name: Name.create('Renamed Commodity').valueOf(),
        updatedAt: Timestamp.create().valueOf(),
      };

      const updatedCommodity = await commodityRepository.update(
        user.id,
        commodityDbRow.id,
        updatedData,
      );

      expect(updatedCommodity).toMatchObject({
        code: commodityDbRow.code,
        id: commodityDbRow.id,
        name: updatedData.name,
        precision: commodityDbRow.precision,
        symbol: commodityDbRow.symbol,
        updatedAt: updatedData.updatedAt,
        userId: commodityDbRow.userId,
      });
    });

    it('should throw an error when trying to update a commodity with an existing CommodityCode', async () => {
      const existingCommodity = await testDB.createCommodity(user.id);

      const updatedData: CommodityRepositoryUpdateInput = {
        code: existingCommodity.code,
        name: Name.create('Updated Commodity').valueOf(),
        updatedAt: Timestamp.create().valueOf(),
      };

      await expect(
        commodityRepository.update(user.id, commodityDbRow.id, updatedData),
      ).rejects.toThrowError(
        new RecordAlreadyExistsError({
          context: {
            field: 'code',
            tableName: 'commodities',
            value: updatedData.code,
          },
        }),
      );
    });

    it('should throw an error when the commodity belongs to a different user', async () => {
      const anotherUser = await testDB.createUser();

      const updatedData: CommodityRepositoryUpdateInput = {
        code: CommodityCode.create('UPD').valueOf(),
        name: Name.create('Updated Commodity').valueOf(),
        updatedAt: Timestamp.create().valueOf(),
      };

      await expect(
        commodityRepository.update(
          anotherUser.id,
          commodityDbRow.id,
          updatedData,
        ),
      ).rejects.toThrowError(RepositoryNotFoundError);
    });

    it('should throw an error when trying to update tombstoned commodity', async () => {
      await commodityRepository.delete(user.id, commodityDbRow.id, {
        updatedAt: Timestamp.create().valueOf(),
      });

      const updatedData: CommodityRepositoryUpdateInput = {
        code: CommodityCode.create('UPD').valueOf(),
        name: Name.create('Updated Commodity').valueOf(),
        updatedAt: Timestamp.create().valueOf(),
      };

      await expect(
        commodityRepository.update(user.id, commodityDbRow.id, updatedData),
      ).rejects.toThrowError(RepositoryNotFoundError);
    });
  });

  describe('delete', () => {
    let commodityDbRow: CommodityDbRow;

    beforeEach(async () => {
      commodityDbRow = await testDB.createCommodity(user.id);
    });

    it('should delete the commodity when it exists', async () => {
      await commodityRepository.delete(user.id, commodityDbRow.id, {
        updatedAt: Timestamp.restore('2030-01-01T00:00:00.000Z').valueOf(),
      });

      const archivedCommodity = await testDB.getCommodityById(
        commodityDbRow.id,
      );

      expect(archivedCommodity).toBeDefined();
      expect(archivedCommodity?.isTombstone).toBe(true);
    });

    it('should throw an error when the commodity does not exist', async () => {
      const nonExistentId = Id.create().valueOf();

      await expect(
        commodityRepository.delete(user.id, nonExistentId, {
          updatedAt: Timestamp.restore('2030-01-01T00:00:00.000Z').valueOf(),
        }),
      ).rejects.toThrowError(RepositoryNotFoundError);
    });

    it('should throw an error when the commodity belongs to a different user', async () => {
      const anotherUser = await testDB.createUser();

      await expect(
        commodityRepository.delete(anotherUser.id, commodityDbRow.id, {
          updatedAt: Timestamp.restore('2030-01-01T00:00:00.000Z').valueOf(),
        }),
      ).rejects.toThrowError(RepositoryNotFoundError);
    });

    it('should throw an error when trying to delete a commodity that is already tombstoned', async () => {
      await commodityRepository.delete(user.id, commodityDbRow.id, {
        updatedAt: Timestamp.restore('2030-01-01T00:00:00.000Z').valueOf(),
      });

      await expect(
        commodityRepository.delete(user.id, commodityDbRow.id, {
          updatedAt: Timestamp.restore('2030-01-01T00:00:00.000Z').valueOf(),
        }),
      ).rejects.toThrowError(RepositoryNotFoundError);
    });
  });

  describe('close', () => {
    let commodityDbRow: CommodityDbRow;

    beforeEach(async () => {
      commodityDbRow = await testDB.createCommodity(user.id);
    });

    it("updates only the 'isClosed' and 'updatedAt' fields when closing a commodity", async () => {
      const updatedAt = Timestamp.restore('2030-01-01T00:00:00.000Z').valueOf();

      const closedCommodity = await commodityRepository.close(
        user.id,
        commodityDbRow.id,
        { updatedAt },
      );

      expect(closedCommodity).toMatchObject({
        id: commodityDbRow.id,
        isClosed: true,
        updatedAt,
      });

      const retrievedCommodity = await testDB.getCommodityById(
        commodityDbRow.id,
      );

      expect(retrievedCommodity?.isClosed).toBe(true);
      expect(retrievedCommodity?.updatedAt).toBe(updatedAt);

      if (!retrievedCommodity) {
        throw new Error('Failed to retrieve commodity for comparison');
      }

      compareEntities(retrievedCommodity, closedCommodity, [
        'isClosed',
        'updatedAt',
      ]);
    });

    it("throws RepositoryNotFoundError when trying to close a commodity that doesn't exist", async () => {
      await expect(
        commodityRepository.close(user.id, Id.create().valueOf(), {
          updatedAt: Timestamp.restore('2030-01-01T00:00:00.000Z').valueOf(),
        }),
      ).rejects.toThrowError(RepositoryNotFoundError);
    });

    it('throws RepositoryNotFoundError when trying to close a commodity that belongs to another user', async () => {
      const anotherUser = await testDB.createUser();

      await expect(
        commodityRepository.close(anotherUser.id, commodityDbRow.id, {
          updatedAt: Timestamp.restore('2030-01-01T00:00:00.000Z').valueOf(),
        }),
      ).rejects.toThrowError(RepositoryNotFoundError);
    });

    it('is idempotent for an already closed commodity', async () => {
      const initialUpdatedAt = Timestamp.restore(
        '2030-01-01T00:00:00.000Z',
      ).valueOf();
      const ignoredUpdatedAt = Timestamp.restore(
        '2031-01-01T00:00:00.000Z',
      ).valueOf();

      await commodityRepository.close(user.id, commodityDbRow.id, {
        updatedAt: initialUpdatedAt,
      });

      const initialRetrievedCommodity = await testDB.getCommodityById(
        commodityDbRow.id,
      );

      const secondCloseAttempt = await commodityRepository.close(
        user.id,
        commodityDbRow.id,
        { updatedAt: ignoredUpdatedAt },
      );

      expect(secondCloseAttempt).toMatchObject({
        id: commodityDbRow.id,
        isClosed: true,
        updatedAt: initialUpdatedAt,
      });

      const retrievedCommodity = await testDB.getCommodityById(
        commodityDbRow.id,
      );

      if (!initialRetrievedCommodity || !retrievedCommodity) {
        throw new Error('Failed to retrieve commodity for comparison');
      }

      compareEntities(initialRetrievedCommodity, retrievedCommodity);
    });

    it('throws RepositoryNotFoundError when trying to close a tombstoned commodity', async () => {
      await commodityRepository.delete(user.id, commodityDbRow.id, {
        updatedAt: Timestamp.restore('2030-01-01T00:00:00.000Z').valueOf(),
      });

      await expect(
        commodityRepository.close(user.id, commodityDbRow.id, {
          updatedAt: Timestamp.restore('2031-01-01T00:00:00.000Z').valueOf(),
        }),
      ).rejects.toThrowError(RepositoryNotFoundError);
    });
  });

  describe('open', () => {
    let closedCommodityDbRow: CommodityDbRow;

    beforeEach(async () => {
      closedCommodityDbRow = await testDB.createCommodity(user.id, {
        isClosed: true,
      });
    });

    it('should open the closed commodity when it exists', async () => {
      const updatedAt = Timestamp.restore('2030-01-01T00:00:00.000Z').valueOf();

      const openedCommodity = await commodityRepository.open(
        user.id,
        closedCommodityDbRow.id,
        { updatedAt },
      );

      expect(openedCommodity).toMatchObject({
        id: closedCommodityDbRow.id,
        isClosed: false,
        updatedAt,
      });

      const retrievedCommodity = await testDB.getCommodityById(
        closedCommodityDbRow.id,
      );

      expect(retrievedCommodity?.isClosed).toBe(false);
      expect(retrievedCommodity?.updatedAt).toBe(updatedAt);

      if (!retrievedCommodity) {
        throw new Error('Failed to retrieve commodity for comparison');
      }

      compareEntities(retrievedCommodity, openedCommodity, [
        'isClosed',
        'updatedAt',
      ]);
    });

    it('is idempotent for an already open commodity', async () => {
      const initialUpdatedAt = Timestamp.restore(
        '2030-01-01T00:00:00.000Z',
      ).valueOf();
      const ignoredUpdatedAt = Timestamp.restore(
        '2031-01-01T00:00:00.000Z',
      ).valueOf();

      await commodityRepository.open(user.id, closedCommodityDbRow.id, {
        updatedAt: initialUpdatedAt,
      });

      const initialRetrievedCommodity = await testDB.getCommodityById(
        closedCommodityDbRow.id,
      );

      const secondOpenAttempt = await commodityRepository.open(
        user.id,
        closedCommodityDbRow.id,
        { updatedAt: ignoredUpdatedAt },
      );

      expect(secondOpenAttempt).toMatchObject({
        id: closedCommodityDbRow.id,
        isClosed: false,
        updatedAt: initialUpdatedAt,
      });

      const retrievedCommodity = await testDB.getCommodityById(
        closedCommodityDbRow.id,
      );

      if (!initialRetrievedCommodity || !retrievedCommodity) {
        throw new Error('Failed to retrieve commodity for comparison');
      }

      compareEntities(initialRetrievedCommodity, retrievedCommodity);
    });

    it("throws RepositoryNotFoundError when trying to open a commodity that doesn't exist", async () => {
      await expect(
        commodityRepository.open(user.id, Id.create().valueOf(), {
          updatedAt: Timestamp.restore('2030-01-01T00:00:00.000Z').valueOf(),
        }),
      ).rejects.toThrowError(RepositoryNotFoundError);
    });

    it('throws RepositoryNotFoundError when trying to open a tombstoned commodity', async () => {
      await commodityRepository.delete(user.id, closedCommodityDbRow.id, {
        updatedAt: Timestamp.restore('2030-01-01T00:00:00.000Z').valueOf(),
      });

      await expect(
        commodityRepository.open(user.id, closedCommodityDbRow.id, {
          updatedAt: Timestamp.restore('2031-01-01T00:00:00.000Z').valueOf(),
        }),
      ).rejects.toThrowError(RepositoryNotFoundError);
    });

    it('throws RepositoryNotFoundError when trying to open a commodity that belongs to another user', async () => {
      const anotherUser = await testDB.createUser();

      await expect(
        commodityRepository.open(anotherUser.id, closedCommodityDbRow.id, {
          updatedAt: Timestamp.restore('2030-01-01T00:00:00.000Z').valueOf(),
        }),
      ).rejects.toThrowError(RepositoryNotFoundError);
    });
  });
});
