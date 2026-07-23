import { apiErrorCodes } from '@ledgerly/shared/types';
import { type CommodityRepositoryUpdateInput } from 'src/application';
import type { CommodityDbRow } from 'src/db/schemas/commodities';
import { UserDbRow } from 'src/db/schemas/users';
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
    it('should return all commodities for the user', async () => {
      const userCommodities = await Promise.all([
        testDB.createCommodity(user.id),
        testDB.createCommodity(user.id),
      ]);

      const commodities = await commodityRepository.getAll(user.id);

      expect(commodities).toEqual(expect.arrayContaining(userCommodities));

      expect(commodities).toHaveLength(userCommodities.length);
    });

    it('should return an empty array when the user has no commodities', async () => {
      const anotherUser = await testDB.createUser();

      const commodities = await commodityRepository.getAll(anotherUser.id);

      expect(commodities).toEqual([]);
    });

    it('should not return tombstoned commodities', async () => {
      const commodity1 = await testDB.createCommodity(user.id);
      const commodity2 = await testDB.createCommodity(user.id);

      await commodityRepository.delete(user.id, commodity1.id, {
        updatedAt: Timestamp.create().valueOf(),
      });

      const commodities = await commodityRepository.getAll(user.id);

      expect(commodities).toEqual(expect.arrayContaining([commodity2]));
      expect(commodities).not.toEqual(expect.arrayContaining([commodity1]));
    });

    it('should not return commodities belonging to other users', async () => {
      const commodity1 = await testDB.createCommodity(user.id);
      const anotherUser = await testDB.createUser();
      const commodity2 = await testDB.createCommodity(anotherUser.id);

      const commodities = await commodityRepository.getAll(user.id);

      expect(commodities).toEqual(expect.arrayContaining([commodity1]));
      expect(commodities).not.toEqual(expect.arrayContaining([commodity2]));
    });
  });

  describe('create', () => {
    it('should create a new commodity for the user', async () => {
      const newCommodityData: CommoditySnapshot = {
        code: CommodityCode.create('NEW').valueOf(),
        createdAt: Timestamp.create().valueOf(),
        id: Id.create().valueOf(),
        isTombstone: false,
        name: Name.create('New Commodity').valueOf(),
        precision: 2,
        symbol: 'N',
        updatedAt: Timestamp.create().valueOf(),
        userId: user.id,
      };

      const createdCommodity =
        await commodityRepository.create(newCommodityData);

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
        isTombstone: false,
        name: Name.create('Duplicate Commodity').valueOf(),
        precision: 2,
        symbol: 'D',
        updatedAt: Timestamp.create().valueOf(),
        userId: user.id,
      };

      await expect(
        commodityRepository.create(newCommodityData),
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
        isTombstone: false,
        name: Name.create('Same Code Commodity').valueOf(),
        precision: 2,
        symbol: 'S',
        updatedAt: Timestamp.create().valueOf(),
        userId: anotherUser.id,
      };

      const createdCommodityForAnotherUser =
        await commodityRepository.create(newCommodityData);

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

      await expect(
        commodityRepository.getById(user.id, commodityDbRow.id),
      ).rejects.toThrowError(RepositoryNotFoundError);
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
});
