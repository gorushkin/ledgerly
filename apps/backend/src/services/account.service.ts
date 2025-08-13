import {
  AccountCreateDTO,
  AccountResponseDTO,
  AccountUpdateDTO,
  UUID,
} from '@ledgerly/shared/types';
import { AccountRepository } from 'src/infrastructure/db/AccountRepository';
import { CurrencyRepository } from 'src/infrastructure/db/CurrencyRepository';
import { NotFoundError } from 'src/presentation/errors/businessLogic.error';

import { BaseService } from './baseService';

export class AccountService extends BaseService {
  constructor(
    private readonly accountRepository: AccountRepository,
    private readonly currencyRepository: CurrencyRepository,
  ) {
    super();
  }

  async validateCurrency(currencyCode: string): Promise<void> {
    const currency = await this.currencyRepository.getById(currencyCode);

    if (!currency) {
      throw new NotFoundError(`Currency with code ${currencyCode} not found`);
    }
  }

  async getAll(userId: UUID): Promise<AccountResponseDTO[]> {
    return this.accountRepository.getAll(userId);
  }

  async ensureAccountExistsAndOwned(
    userId: UUID,
    id: UUID,
  ): Promise<AccountResponseDTO | void> {
    const account = this.ensureEntityExists(
      await this.accountRepository.getById(userId, id),
      'Account not found',
      {
        attemptedUserId: userId,
        entity: 'Account',
        entityId: id,
        reason: 'missing',
      },
    );

    this.ensureAuthorized(account?.userId === userId, 'Account not found', {
      attemptedUserId: userId,
      entity: 'Account',
      entityId: id,
      ownerUserId: account?.userId,
      reason: 'forbidden',
    });

    return account;
  }

  async getById(userId: UUID, id: UUID): Promise<AccountResponseDTO | void> {
    return this.ensureAccountExistsAndOwned(userId, id);
  }

  async create(data: AccountCreateDTO): Promise<AccountResponseDTO> {
    await this.validateCurrency(data.originalCurrency);

    return this.accountRepository.create({
      ...data,
      currentClearedBalanceLocal: data.initialBalance,
    });
  }

  async update(
    userId: UUID,
    id: UUID,
    data: AccountUpdateDTO,
  ): Promise<AccountResponseDTO | void> {
    if (data.originalCurrency) {
      await this.validateCurrency(data.originalCurrency);
    }

    await this.ensureAccountExistsAndOwned(userId, id);

    return this.accountRepository.update(userId, id, data);
  }

  async delete(userId: UUID, id: UUID): Promise<void> {
    await this.ensureAccountExistsAndOwned(userId, id);

    return await this.accountRepository.delete(userId, id);
  }
}
