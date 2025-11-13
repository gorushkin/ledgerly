import { TransactionQueryParams, UUID } from '@ledgerly/shared/types';
import { transactionCreateSchema } from '@ledgerly/shared/validation';
import { CreateTransactionRequestDTO } from 'src/application';
import {
  CreateTransactionUseCase,
  GetTransactionByIdUseCase,
  GetAllTransactionsUseCase,
} from 'src/application/usecases/transaction/';
import { User } from 'src/domain';

export class TransactionController {
  constructor(
    private readonly createTransaction: CreateTransactionUseCase,
    private readonly getTransactionById: GetTransactionByIdUseCase,
    private readonly getAllTransactions: GetAllTransactionsUseCase,
  ) {}

  async create(user: User, requestBody: CreateTransactionRequestDTO) {
    const transactionCreateDto = transactionCreateSchema.parse(requestBody);

    return this.createTransaction.execute(user, transactionCreateDto);
  }

  async getById(user: User, transactionId: UUID) {
    return this.getTransactionById.execute(user.id, transactionId);
  }

  async getAll(user: User, query?: TransactionQueryParams) {
    return this.getAllTransactions.execute(user.id, query);
  }
}
