import { apiErrorCodes } from '@ledgerly/shared/types';
import type { CommodityDbRow } from 'src/db/schemas/commodities';
import { UserDbRow } from 'src/db/schemas/users';
import { Id } from 'src/domain/domain-core/value-objects/Id';
import { RepositoryNotFoundError } from 'src/infrastructure/errors';
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
});
