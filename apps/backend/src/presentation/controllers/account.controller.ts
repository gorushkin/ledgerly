import { accountRepository } from 'src/infrastructure/db/AccountRepository';

import type { AccountDTO } from '@ledgerly/shared';
import { NotFoundError } from '../errors/httpErrors';

export class AccountController {
  getAll() {
    return accountRepository.getAllAccounts();
  }

  async getById(id: string) {
    const account = await accountRepository.getAccountById(id);

    if (!account) {
      throw new NotFoundError('Account not found');
    }

    return account;
  }

  create(newAccount: AccountDTO) {
    return accountRepository.createAccount(newAccount);
  }

  update(id: string, updatedAccount: AccountDTO) {
    return accountRepository.updateAccount(id, updatedAccount);
  }

  delete(id: string) {
    return accountRepository.deleteAccount(id);
  }
}

export const accountController = new AccountController();
