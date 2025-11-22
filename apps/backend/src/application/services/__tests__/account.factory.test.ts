import { CurrencyCode } from '@ledgerly/shared/types';
import { AccountRepositoryInterface } from 'src/application/interfaces';
import { createUser } from 'src/db/createTestUser';
import { User } from 'src/domain';
import { AccountType } from 'src/domain/accounts/account-type.enum.ts';
import { Account } from 'src/domain/accounts/account.entity';
import { Amount, Currency, Name } from 'src/domain/domain-core';
import { RepositoryNotFoundError } from 'src/infrastructure/infrastructure.errors';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { AccountFactory } from '../account.factory';

describe('CreateAccountUseCase', () => {
  let user: User;

  const mockAccountRepository = {
    create: vi.fn(),
    findSystemAccount: vi.fn(),
  };

  const mockedSaveWithIdRetry = vi.fn();

  const accountFactory = new AccountFactory(
    mockAccountRepository as unknown as AccountRepositoryInterface,
    mockedSaveWithIdRetry,
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
      const mockAccount = Account.create(
        user,
        Name.create(accountName),
        description,
        Amount.create(initialBalance),
        Currency.create(currency),
        AccountType.create(accountType),
      );

      mockedSaveWithIdRetry.mockResolvedValue(mockAccount);

      const account = await accountFactory.createAccount(user, {
        currency,
        description,
        initialBalance,
        name: accountName,
        type: accountType,
      });

      expect(account).toBe(mockAccount);

      expect(account).toBeInstanceOf(Account);

      const accountPersistenceDTO = account.toPersistence();

      expect(accountPersistenceDTO.name).toBe(accountName);
      expect(accountPersistenceDTO.description).toBe(description);
      expect(accountPersistenceDTO.initialBalance).toBe(initialBalance);
      expect(accountPersistenceDTO.currency).toBe(currency);
      expect(accountPersistenceDTO.type).toBe(accountType);
      expect(accountPersistenceDTO.isSystem).toBe(false);

      expect(mockedSaveWithIdRetry).toHaveBeenCalledWith(
        expect.any(Function),
        expect.any(Function),
      );
    });
  });

  describe('findOrCreateSystemAccount', () => {
    it('should create a system account if not found', async () => {
      mockAccountRepository.findSystemAccount.mockRejectedValueOnce(
        new RepositoryNotFoundError('Not found'),
      );

      const mockAccount = Account.create(
        user,
        Name.create(`Trading System Account (${currency})`),
        `System account for ${currency} currency trading`,
        Amount.create('0'),
        Currency.create(currency),
        AccountType.create('currencyTrading'),
      );

      mockedSaveWithIdRetry.mockResolvedValue(mockAccount);

      const account = await accountFactory.findOrCreateSystemAccount(
        user,
        currency,
      );

      expect(account).toBeDefined();
      expect(account).toBeInstanceOf(Account);

      const accountPersistenceDTO = account.toPersistence();

      expect(accountPersistenceDTO.name).toBe(
        `Trading System Account (${currency})`,
      );

      expect(accountPersistenceDTO.description).toBe(
        `System account for ${currency} currency trading`,
      );

      expect(accountPersistenceDTO.initialBalance).toBe(
        Amount.create('0').valueOf(),
      );

      expect(accountPersistenceDTO.currency).toBe(currency);
      expect(accountPersistenceDTO.type).toBe('currencyTrading');
      expect(accountPersistenceDTO.isSystem).toBe(true);
    });
  });
});
