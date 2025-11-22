import {
  AccountCreateDTO,
  AccountResponseDTO,
  CurrencyCode,
} from '@ledgerly/shared/types';
import { SaveWithIdRetryType } from 'src/application/shared/saveWithIdRetry';
import { AccountRepoInsert } from 'src/db/schema';
import { AccountType } from 'src/domain/accounts/account-type.enum.ts';
import { Account } from 'src/domain/accounts/account.entity';
import { Amount, Currency, Name } from 'src/domain/domain-core';
import { User } from 'src/domain/users/user.entity';
import { RepositoryNotFoundError } from 'src/infrastructure/infrastructure.errors';

import { AccountRepositoryInterface } from '../interfaces';

export class AccountFactory {
  constructor(
    protected readonly accountRepository: AccountRepositoryInterface,
    protected readonly saveWithIdRetry: SaveWithIdRetryType,
  ) {}

  async createAccount(user: User, data: AccountCreateDTO): Promise<Account> {
    const { currency, description, initialBalance, name, type } = data;

    const createAccount = () =>
      Account.create(
        user,
        Name.create(name),
        description,
        Amount.create(initialBalance),
        Currency.create(currency),
        AccountType.create(type),
      );

    return this.saveWithIdRetry<AccountRepoInsert, Account, AccountResponseDTO>(
      this.accountRepository.create.bind(this.accountRepository),
      createAccount,
    );
  }

  async findOrCreateSystemAccount(
    user: User,
    currency: CurrencyCode,
  ): Promise<Account> {
    try {
      const systemAccount = await this.accountRepository.findSystemAccount(
        user.getId().valueOf(),
        currency,
      );
      return Account.restore(systemAccount);
    } catch (error) {
      if (error instanceof RepositoryNotFoundError) {
        return await this.createAccount(user, {
          currency,
          description: `System account for ${currency} currency trading`,
          initialBalance: Amount.create('0').valueOf(),
          name: `Trading System Account (${currency})`,
          type: 'currencyTrading',
        });
      }
      throw error;
    }
  }
}
