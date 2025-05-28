import {
  TransactionCreateDTO,
  TransactionResponseDTO,
} from '@ledgerly/shared/types';
import { transactionRepository } from 'src/infrastructure/db/TransactionRepository';

export class TransactionController {
  getAll() {
    return transactionRepository.getAllTransactions();
  }

  async getById(id: string): Promise<TransactionResponseDTO> {
    const transaction = await transactionRepository.getTransactionById(id);

    if (!transaction) {
      throw new Error(`Transaction with ID ${id} not found.`);
    }

    return transaction;
  }

  create(newTransaction: TransactionCreateDTO) {
    // TODO: add operations validations
    return transactionRepository.createTransaction(newTransaction);
  }

  update(_id: string, _updatedAccount: TransactionResponseDTO) {
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
