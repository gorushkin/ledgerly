import { AccountCreateDTO } from '@ledgerly/shared/types';
import { AccountRepository } from 'src/infrastructure/db/AccountRepository';

import { NotFoundError } from '../errors/httpErrors';

export class AccountController {
  constructor(private readonly repo: AccountRepository) {}

  getAll() {
    return this.repo.getAllAccounts();
  }

  async getById(id: string) {
    const account = await this.repo.getAccountById(id);

    if (!account) {
      throw new NotFoundError('Account not found');
    }

    return account;
  }

  create(newAccount: AccountCreateDTO) {
    return this.repo.createAccount(newAccount);
  }

  update(id: string, updatedAccount: AccountCreateDTO) {
    return this.repo.updateAccount(id, updatedAccount);
  }

  delete(id: string) {
    return this.repo.deleteAccount(id);
  }
}
