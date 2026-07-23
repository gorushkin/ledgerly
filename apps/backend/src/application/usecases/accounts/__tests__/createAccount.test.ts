import { AccountRepositoryInterface } from 'src/application';
import { createUser } from 'src/db/createTestUser';
import { Commodity } from 'src/domain';
import { Amount, CommodityCode } from 'src/domain/domain-core';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { CreateAccountUseCase } from '../createAccount';

describe('CreateAccountUseCase', async () => {
  const user = await createUser();

  let createAccountUseCase: CreateAccountUseCase;

  const accountRepository = {
    create: vi.fn(),
  };

  const name = 'Test Account';
  const description = 'Test account description';
  const initialBalance = Amount.create('1000').valueOf();
  const currentClearedBalanceLocal = Amount.create('0').valueOf();

  const commodity = Commodity.create(user, {
    code: CommodityCode.create('USD').valueOf(),
    name: 'Test Commodity',
    precision: 2,
    symbol: null,
  });
  const type = 'asset';

  beforeEach(() => {
    createAccountUseCase = new CreateAccountUseCase(
      accountRepository as unknown as AccountRepositoryInterface,
    );
  });

  describe('execute', () => {
    it('should create a new account successfully', async () => {
      // Arrange

      const mockedCommoditySnapshot = commodity.toSnapshot();

      // Act
      const result = await createAccountUseCase.execute(user, {
        commodityId: mockedCommoditySnapshot.id,
        description,
        initialBalance,
        name,
        type,
      });

      expect(accountRepository.create).toHaveBeenCalledWith({
        commodityId: result.commodityId,
        createdAt: result.createdAt,
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
        description,
        initialBalance,
        isSystem: false,
        name,
        type,
        userId: user.getId().valueOf(),
      });
    });
  });
});
