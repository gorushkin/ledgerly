import { CurrencyCode } from '@ledgerly/shared/types';
import {
  AccountRepositoryInterface,
  CommodityRepositoryInterface,
  EntityNotFoundError,
} from 'src/application';
import { createUser } from 'src/db/createTestUser';
import { Commodity } from 'src/domain';
import { Amount, CommodityCode, Name } from 'src/domain/domain-core';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { CreateAccountUseCase } from '../createAccount';

describe('CreateAccountUseCase', async () => {
  const user = await createUser();

  let createAccountUseCase: CreateAccountUseCase;

  const commodityRepository = {
    getById: vi.fn(),
  };
  const accountRepository = {
    create: vi.fn(),
  };

  const name = 'Test Account';
  const description = 'Test account description';
  const initialBalance = Amount.create('1000').valueOf();
  const currentClearedBalanceLocal = Amount.create('0').valueOf();
  const currency = 'USD' as CurrencyCode;

  const commodity = Commodity.create(
    user,
    Name.create('Test Commodity'),
    CommodityCode.create('TEST'),
    2,
    null,
  );
  const type = 'asset';

  beforeEach(() => {
    createAccountUseCase = new CreateAccountUseCase(
      accountRepository as unknown as AccountRepositoryInterface,
      commodityRepository as unknown as CommodityRepositoryInterface,
    );
  });

  describe('execute', () => {
    it('should create a new account successfully', async () => {
      // Arrange

      const mockedCommoditySnapshot = commodity.toSnapshot();
      commodityRepository.getById.mockResolvedValue(mockedCommoditySnapshot);

      // Act
      const result = await createAccountUseCase.execute(user, {
        commodityId: mockedCommoditySnapshot.id,
        currency: currency,
        description,
        initialBalance,
        name,
        type,
      });

      expect(commodityRepository.getById).toHaveBeenCalledWith(
        user.getId().valueOf(),
        mockedCommoditySnapshot.id,
      );

      expect(accountRepository.create).toHaveBeenCalledWith({
        commodityId: result.commodityId,
        createdAt: result.createdAt,
        currency,
        currentClearedBalanceLocal,
        description,
        id: result.id,
        initialBalance,
        isSystem: false,
        isTombstone: false,
        name,
        type,
        updatedAt: result.updatedAt,
        userId: result.userId,
      });

      expect(result).toMatchObject({
        currency,
        description,
        initialBalance,
        isSystem: false,
        name,
        type,
        userId: user.getId().valueOf(),
      });
    });

    it('should throw an error if the commodity does not belong to the user', async () => {
      // Arrange
      const anotherUser = await createUser();
      const anotherCommodity = Commodity.create(
        anotherUser,
        Name.create('Another Commodity'),
        CommodityCode.create('ANOTHER'),
        2,
        null,
      );
      const mockedAnotherCommoditySnapshot = anotherCommodity.toSnapshot();

      commodityRepository.getById.mockRejectedValue(
        new EntityNotFoundError({
          entityId: mockedAnotherCommoditySnapshot.id,
          entityType: 'commodity',
        }),
      );

      // Act & Assert
      await expect(
        createAccountUseCase.execute(user, {
          commodityId: mockedAnotherCommoditySnapshot.id,
          currency: currency,
          description,
          initialBalance,
          name,
          type,
        }),
      ).rejects.toThrowError(EntityNotFoundError);
    });
  });
});
