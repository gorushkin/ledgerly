import { CurrencyCode } from '@ledgerly/shared/types';
import { AccountFactory } from 'src/application/services/account.factory';
import { createUser } from 'src/db/createTestUser';
import { Account } from 'src/domain/accounts/account.entity';
import { Amount } from 'src/domain/domain-core';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { CreateAccountUseCase } from '../createAccount';

describe('CreateAccountUseCase', async () => {
  const user = await createUser();

  let createAccountUseCase: CreateAccountUseCase;

  let accountFactory: { createAccount: ReturnType<typeof vi.fn> };

  const name = 'Test Account';
  const description = 'Test account description';
  const initialBalance = Amount.create('1000').valueOf();
  const currency = 'USD' as CurrencyCode;
  const type = 'asset';

  beforeEach(() => {
    accountFactory = {
      createAccount: vi.fn(),
    };

    createAccountUseCase = new CreateAccountUseCase(
      accountFactory as unknown as AccountFactory,
    );
  });

  describe('execute', () => {
    it('should create a new account successfully', async () => {
      // Arrange

      const mockedResult = { data: 'some account data' };

      const mockedAccount = {
        toPersistence: vi.fn().mockResolvedValue(mockedResult),
      } as unknown as Account;

      accountFactory.createAccount.mockResolvedValue(mockedAccount);

      // Act
      const result = await createAccountUseCase.execute(user, {
        currency: currency,
        description,
        initialBalance,
        name,
        type,
      });

      expect(accountFactory.createAccount).toHaveBeenCalledWith(user, {
        currency: currency,
        description,
        initialBalance,
        name,
        type,
      });

      expect(result).toEqual(mockedResult);
    });
  });
});
