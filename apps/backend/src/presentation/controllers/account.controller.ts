import { AccountCreateDTO } from '@ledgerly/shared/types';
import { accountRepository } from 'src/infrastructure/db/AccountRepository';

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

  create(newAccount: AccountCreateDTO) {
    return accountRepository.createAccount(newAccount);
  }

  update(id: string, updatedAccount: AccountCreateDTO) {
    return accountRepository.updateAccount(id, updatedAccount);
  }

  delete(id: string) {
    return accountRepository.deleteAccount(id);
  }

  // TODO: Move to transactions controller
  // This method is not implemented yet, but it should be moved to a transactions controller
  // and should handle transactions related to the account.
  // For now, it just throws an error.

  getTransactionsById(id: string): Promise<void> {
    console.info('id: ', id);

    throw new Error('Method getTransactionsById not implemented.');
  }

  createTransaction(id: string, transaction: unknown): Promise<void> {
    console.info('id: ', id);
    console.info('transaction: ', transaction);

    throw new Error('Method createTransaction not implemented.');
  }
}

export const accountController = new AccountController();
