import { CurrencyCode } from '@ledgerly/shared/types';
import { AccountRepositoryInterface } from 'src/application/interfaces';
import { createUser } from 'src/db/createTestUser';
import { User } from 'src/domain';
import { AccountType } from 'src/domain/accounts/account-type.enum.ts';
import { Account } from 'src/domain/accounts/account.entity';
import { Amount, Currency } from 'src/domain/domain-core';
import { NotFoundError } from 'src/presentation/errors/businessLogic.error';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { AccountFactory } from '../account.factory';

describe('CreateAccountUseCase', () => {
  let user: User;

  let accountFactory: AccountFactory;

  let mockAccountRepository: {
    create: ReturnType<typeof vi.fn>;
    findSystemAccount: ReturnType<typeof vi.fn>;
  };

  let mockedSaveWithIdRetry: ReturnType<typeof vi.fn>;

  const accountName = 'Test Account';
  const description = 'Test account description';
  const initialBalance = Amount.create('1000').valueOf();
  const currency = 'USD' as CurrencyCode;
  const accountType = 'asset';

  beforeEach(async () => {
    user = await createUser();

    mockAccountRepository = {
      create: vi.fn(),
      findSystemAccount: vi.fn(),
    };

    mockedSaveWithIdRetry = vi
      .fn()
      .mockResolvedValue({ name: 'mocked account' }); // Mock implementation

    accountFactory = new AccountFactory(
      mockAccountRepository as unknown as AccountRepositoryInterface,
      mockedSaveWithIdRetry,
    );
  });

  describe('createAccount', () => {
    it('should create an account with correct properties', async () => {
      const mockedAccount = {} as unknown as Account;

      vi.spyOn(Account, 'create').mockReturnValue(mockedAccount);

      await accountFactory.createAccount(user, {
        currency,
        description,
        initialBalance,
        name: accountName,
        type: accountType,
      });

      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(Account.create).toHaveBeenCalledWith(
        user,
        expect.objectContaining({ value: accountName }),
        description,
        Amount.create(initialBalance),
        Currency.create(currency),
        AccountType.create(accountType),
      );
    });

    it.skip('should call saveWithIdRetry with correct parameters', async () => {
      const mockedAccount = {} as unknown as Account;

      vi.spyOn(Account, 'create').mockReturnValue(mockedAccount);

      await accountFactory.createAccount(user, {
        currency,
        description,
        initialBalance,
        name: accountName,
        type: accountType,
      });

      expect(mockedSaveWithIdRetry).toHaveBeenCalledWith(
        mockedAccount,
        mockAccountRepository.create.bind(mockAccountRepository),
        expect.any(Function),
      );
    });
  });

  describe('findOrCreateSystemAccount', () => {
    it('should create a system account if not found', async () => {
      vi.spyOn(
        mockAccountRepository,
        'findSystemAccount',
      ).mockRejectedValueOnce(new NotFoundError('Not found'));

      const createAccountSpy = vi
        .spyOn(accountFactory, 'createAccount')
        .mockResolvedValueOnce({} as unknown as Account);

      await accountFactory.findOrCreateSystemAccount(user, currency);

      expect(createAccountSpy).toHaveBeenCalledWith(user, {
        currency,
        description: `System account for ${currency} currency trading`,
        initialBalance: Amount.create('0').valueOf(),
        name: `Trading System Account (${currency})`,
        type: 'currencyTrading',
      });
    });
  });
});
