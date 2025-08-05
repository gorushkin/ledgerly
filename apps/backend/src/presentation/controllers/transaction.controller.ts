import { UUID } from '@ledgerly/shared/types';
import { TransactionService } from 'src/services/transaction.service';

export class TransactionController {
  constructor(
    // private readonly repo: TransactionRepository,
    // private readonly operationController: OperationController,
    private readonly transactionService: TransactionService,
  ) {}

  getAll(userId: UUID) {
    return this.transactionService.getAllByUserId(userId);
  }

  // async getById(id: string): Promise<TransactionResponse> {
  //   const transaction = await this.repo.getTransactionById(id);

  //   if (!transaction) {
  //     throw new Error(`Transaction with ID ${id} not found.`);
  //   }

  //   return transaction;
  // }

  // async validateTransaction(operations: TransactionCreate['operations']) {
  //   const totalSum = operations.reduce((sum, op) => sum + op.localAmount, 0);
  //   if (totalSum !== 0) {
  //     throw new BadRequestError('Сумма всех операций должна быть равна 0');
  //   }

  //   if (operations.length < 2) {
  //     throw new BadRequestError(
  //       'Транзакция должна содержать минимум 2 операции',
  //     );
  //   }

  //   // Валидация каждой операции
  //   for (const operation of operations) {
  //     await this.operationController.validateOperation(operation);
  //   }
  // }

  // async create(transactionData: TransactionCreate) {
  //   await this.validateTransaction(transactionData.operations);

  //   return this.repo.createTransaction(transactionData);
  // }

  // update(_id: string, _updatedAccount: TransactionResponse) {
  //   throw new Error('Method update not implemented.');
  // }

  // delete(_id: string) {
  //   throw new Error('Method delete not implemented.');
  // }
}
