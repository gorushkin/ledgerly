import { AccountCreateDTO, TransactionCreateDTO } from '@ledgerly/shared/types';
import { transactionRepository } from 'src/infrastructure/db/TransactionRepository';

export class TransactionController {
  getAll() {
    throw new Error('Method getAll not implemented.');
    // return accountRepository.getAllAccounts();
  }

  getById(_id: string) {
    throw new Error('Method getById not implemented.');
  }

  create(newTransaction: TransactionCreateDTO) {
    // TODO: add operations validations
    return transactionRepository.createTransaction(newTransaction);
  }

  update(_id: string, _updatedAccount: AccountCreateDTO) {
    throw new Error('Method update not implemented.');
  }

  delete(_id: string) {
    throw new Error('Method delete not implemented.');
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

export const transactionController = new TransactionController();
