import {
  AccountCreateDTO,
  AccountResponseDTO,
  CurrencyCode,
  UUID,
} from '@ledgerly/shared/types';
import { AccountType } from 'src/domain/accounts/account-type.enum.ts';
import { Account } from 'src/domain/accounts/account.entity';
import { Amount } from 'src/domain/domain-core';
import { Id } from 'src/domain/domain-core/value-objects/Id';
import { AccountRepository } from 'src/infrastructure/db/accounts/account.repository';
import { UsersRepository } from 'src/infrastructure/db/UsersRepository';

import { AccountBase } from './accountBase';

export class CreateAccountUseCase extends AccountBase {
  constructor(
    accountRepository: AccountRepository,
    userRepository: UsersRepository,
  ) {
    super(accountRepository, userRepository);
  }

  private isValidCurrencyCode(code: string): code is CurrencyCode {
    const validCodes = ['USD', 'EUR', 'GBP', 'RUB'];
    return validCodes.includes(code);
  }

  async execute(
    userId: UUID,
    data: AccountCreateDTO,
  ): Promise<AccountResponseDTO> {
    const { currency, description, initialBalance, name, type } = data;
    await this.ensureUserExists(userId);

    if (!this.isValidCurrencyCode(currency)) {
      throw new Error(`Invalid currency code`);
    }

    const userIdVO = Id.restore(userId);

    const account = Account.create(
      userIdVO,
      name,
      description,
      Amount.create(initialBalance),
      currency,
      AccountType.create(type),
    );

    return this.accountRepository.create(account.toPersistence());
  }
}
