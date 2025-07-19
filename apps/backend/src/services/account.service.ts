import { AccountCreate, AccountResponse, UUID } from '@ledgerly/shared/types';
import { AccountRepository } from 'src/infrastructure/db/AccountRepository';
import { CurrencyRepository } from 'src/infrastructure/db/CurrencyRepository';
import { NotFoundError } from 'src/presentation/errors';

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
      throw new NotFoundError(`Currency with code ${currencyCode} not found`, {
        entity: 'Currency',
        entityId: currencyCode,
      });
    }
  }

  async getAll(userId: UUID): Promise<AccountResponse[]> {
    return this.accountRepository.getAll(userId);
  }

  async ensureAccountExistsAndOwned(
    userId: UUID,
    id: UUID,
  ): Promise<AccountResponse> {
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

  async getById(userId: UUID, id: UUID): Promise<AccountResponse> {
    return this.ensureAccountExistsAndOwned(userId, id);
  }

  async create(data: AccountCreate): Promise<AccountResponse> {
    await this.validateCurrency(data.originalCurrency);

    return this.accountRepository.create(data);
  }

  async update(
    data: AccountCreate,
    id: UUID,
    userId: UUID,
  ): Promise<AccountResponse> {
    await this.validateCurrency(data.originalCurrency);

    await this.ensureAccountExistsAndOwned(userId, id);

    return this.accountRepository.update(id, data, userId);
  }

  async delete(userId: UUID, id: UUID): Promise<AccountResponse> {
    await this.ensureAccountExistsAndOwned(userId, id);

    // TODO: fix ts error
    return this.accountRepository.delete(userId, id);
  }
}
