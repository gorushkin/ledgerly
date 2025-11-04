import { AccountCreateDTO, AccountResponseDTO } from '@ledgerly/shared/types';
import { SaveWithIdRetryType } from 'src/application/shared/saveWithIdRetry';
import { AccountRepoInsert } from 'src/db/schema';
import { AccountType } from 'src/domain/accounts/account-type.enum.ts';
import { Account } from 'src/domain/accounts/account.entity';
import { Amount, Currency, Name } from 'src/domain/domain-core';
import { User } from 'src/domain/users/user.entity';

import { AccountRepositoryInterface } from '../interfaces';

export class AccountFactory {
  constructor(
    protected readonly accountRepository: AccountRepositoryInterface,
    protected readonly saveWithIdRetry: SaveWithIdRetryType,
  ) {}

  async createAccount(user: User, data: AccountCreateDTO): Promise<Account> {
    const { currency, description, initialBalance, name, type } = data;

    const accountType = AccountType.create(type);

    const isSystem = accountType.isSystemType();

    const createAccount = () =>
      Account.create(
        user,
        Name.create(name),
        description,
        Amount.create(initialBalance),
        Currency.create(currency),
        accountType,
        isSystem,
      );

    const account = createAccount();

    await this.saveWithIdRetry<AccountRepoInsert, Account, AccountResponseDTO>(
      account,
      this.accountRepository.create.bind(this.accountRepository),
      createAccount,
    );

    return account;
  }
}
