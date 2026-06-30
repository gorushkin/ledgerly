import { AccountCreateDTO } from '@ledgerly/shared/types';
import { AccountMapper } from 'src/application/mappers';
import { AccountType, Account } from 'src/domain/';
import { Amount, Currency, Name } from 'src/domain/domain-core';
import { User } from 'src/domain/users/user.entity';

import { AccountRepositoryInterface } from '../interfaces';

export class AccountFactory {
  constructor(
    protected readonly accountRepository: AccountRepositoryInterface,
  ) {}

  async createAccount(user: User, data: AccountCreateDTO): Promise<Account> {
    const { currency, description, initialBalance, name, type } = data;

    const account = Account.create(
      user,
      Name.create(name),
      description,
      Amount.create(initialBalance),
      Currency.create(currency),
      AccountType.create(type),
    );

    await this.accountRepository.create(AccountMapper.toDBRow(account));

    return account;
  }
}
