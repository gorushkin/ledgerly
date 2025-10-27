import { AccountCreateDTO, AccountResponseDTO } from '@ledgerly/shared/types';
import { SaveWithIdRetryType } from 'src/application/shared/saveWithIdRetry';
import { AccountRepoInsert } from 'src/db/schema';
import { AccountType } from 'src/domain/accounts/account-type.enum.ts';
import { Account } from 'src/domain/accounts/account.entity';
import { Amount, Currency, Name } from 'src/domain/domain-core';
import { User } from 'src/domain/users/user.entity';

import { AccountRepositoryInterface } from '../../interfaces';

import { AccountUseCaseBase } from './accountBase';

export class CreateAccountUseCase extends AccountUseCaseBase {
  constructor(
    accountRepository: AccountRepositoryInterface,
    protected readonly saveWithIdRetry: SaveWithIdRetryType,
  ) {
    super(accountRepository);
  }

  async execute(
    user: User,
    data: AccountCreateDTO,
  ): Promise<AccountResponseDTO> {
    const { currency, description, initialBalance, name, type } = data;

    user.validUserOwnership(data.userId);

    const createAccount = () =>
      Account.create(
        user,
        Name.create(name),
        description,
        Amount.create(initialBalance),
        Currency.create(currency),
        AccountType.create(type),
      );

    const account = createAccount();

    return this.saveWithIdRetry<AccountRepoInsert, Account, AccountResponseDTO>(
      account,
      this.accountRepository.create.bind(this.accountRepository),
      createAccount,
    );
  }
}
