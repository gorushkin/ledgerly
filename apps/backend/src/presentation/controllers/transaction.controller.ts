import {
  TransactionCreateDTO,
  TransactionResponseDTO,
} from '@ledgerly/shared/types';
import { transactionRepository } from 'src/infrastructure/db/TransactionRepository';

import { operationController } from './operation.controller';

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

  async create(newTransaction: TransactionCreateDTO) {
    await operationController.validateOperations(newTransaction.operations);

    return transactionRepository.createTransaction(newTransaction);
  }

  update(_id: string, _updatedAccount: TransactionResponseDTO) {
    throw new Error('Method update not implemented.');
  }

  delete(_id: string) {
    throw new Error('Method delete not implemented.');
  }
}

export const transactionController = new TransactionController();
