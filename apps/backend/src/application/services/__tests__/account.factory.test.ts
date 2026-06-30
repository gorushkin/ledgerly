import { CurrencyCode } from '@ledgerly/shared/types';
import { AccountRepositoryInterface } from 'src/application/interfaces';
import { AccountMapper } from 'src/application/mappers';
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
        AccountMapper.toDBRow(expectedAccount),
      );

      const account = await accountFactory.createAccount(user, {
        currency,
        description,
        initialBalance,
        name: accountName,
        type: accountType,
      });

      expect(account).toBeInstanceOf(Account);

      const accountPersistenceDTO = AccountMapper.toDBRow(account);

      expect(accountPersistenceDTO.name).toBe(accountName);
      expect(accountPersistenceDTO.description).toBe(description);
      expect(accountPersistenceDTO.initialBalance).toBe(initialBalance);
      expect(accountPersistenceDTO.currency).toBe(currency);
      expect(accountPersistenceDTO.type).toBe(accountType);
      expect(accountPersistenceDTO.isSystem).toBe(false);

      expect(mockAccountRepository.create).toHaveBeenCalledWith(
        accountPersistenceDTO,
      );
    });
  });
});
