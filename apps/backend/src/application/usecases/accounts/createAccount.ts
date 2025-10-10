import {
  AccountCreateDTO,
  AccountResponseDTO,
  CurrencyCode,
  UUID,
} from '@ledgerly/shared/types';
import { SaveWithIdRetryType } from 'src/application/shared/saveWithIdRetry';
import { AccountRepoInsert } from 'src/db/schema';
import { AccountType } from 'src/domain/accounts/account-type.enum.ts';
import { Account } from 'src/domain/accounts/account.entity';
import { Amount, Currency, Name } from 'src/domain/domain-core';
import { Id } from 'src/domain/domain-core/value-objects/Id';
import { UsersRepository } from 'src/infrastructure/db/UsersRepository';

import { AccountRepository } from '../../interfaces:toRefactor';

import { AccountUseCaseBase } from './accountUseCaseBase';

export class CreateAccountUseCase extends AccountUseCaseBase {
  constructor(
    accountRepository: AccountRepository,
    userRepository: UsersRepository,
    protected readonly saveWithIdRetry: SaveWithIdRetryType,
  ) {
    super(accountRepository, userRepository);
  }

  private isValidCurrencyCode(code: string): code is CurrencyCode {
    const validCodes: string[] = ['USD', 'EUR', 'GBP', 'RUB'];
    return validCodes.includes(code);
  }

  async execute(
    userId: UUID,
    data: AccountCreateDTO,
  ): Promise<AccountResponseDTO> {
    const { currency, description, initialBalance, name, type } = data;
    // TODO: move validation to the middleware
    await this.ensureUserExists(userId);

    if (!this.isValidCurrencyCode(currency)) {
      throw new Error(`Invalid currency code: ${String(currency)}`);
    }

    const userIdVO = Id.fromPersistence(userId);

    const account = Account.create(
      userIdVO,
      Name.create(name),
      description,
      Amount.create(initialBalance),
      Currency.create(currency),
      AccountType.create(type),
    );

    return this.saveWithIdRetry<AccountRepoInsert, Account, AccountResponseDTO>(
      account,
      this.accountRepository.create.bind(this.accountRepository),
    );
  }
}
