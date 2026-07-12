import { CurrencyCode } from '@ledgerly/shared/types';
import type { AccountRepositoryInterface } from 'src/application/interfaces';
import { createUser } from 'src/db/createTestUser';
import { User } from 'src/domain';
import { Account, AccountType } from 'src/domain/';
import { Amount, Currency, Name } from 'src/domain/domain-core';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { AccountFactory } from '../account.factory';

describe('CreateAccountUseCase', () => {
  let user: User;

  const mockAccountRepository = {
    create: vi.fn(),
    findSystemAccount: vi.fn(),
  };

  const accountFactory = new AccountFactory(
    mockAccountRepository as unknown as AccountRepositoryInterface,
  );

  const accountName = 'Test Account';
  const description = 'Test account description';
  const initialBalance = Amount.create('1000').valueOf();
  const currency = 'USD' as CurrencyCode;
  const accountType = 'asset';

  beforeEach(async () => {
    user = await createUser();
  });

  describe('createAccount', () => {
    it('should create an account with correct properties', async () => {
      const expectedAccount = Account.create(
        user,
        Name.create(accountName),
        description,
        Amount.create(initialBalance),
        Currency.create(currency),
        AccountType.create(accountType),
      );

      mockAccountRepository.create.mockResolvedValue(
        expectedAccount.toSnapshot(),
      );

      const account = await accountFactory.createAccount(user, {
        currency,
        description,
        initialBalance,
        name: accountName,
        type: accountType,
      });

      expect(account).toBeInstanceOf(Account);

      const accountSnapshot = account.toSnapshot();

      expect(accountSnapshot.name).toBe(accountName);
      expect(accountSnapshot.description).toBe(description);
      expect(accountSnapshot.initialBalance).toBe(initialBalance);
      expect(accountSnapshot.currency).toBe(currency);
      expect(accountSnapshot.type).toBe(accountType);
      expect(accountSnapshot.isSystem).toBe(false);

      expect(mockAccountRepository.create).toHaveBeenCalledWith(
        accountSnapshot,
      );
    });
  });
});
