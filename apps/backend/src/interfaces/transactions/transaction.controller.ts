import { TransactionQueryParams, UUID } from '@ledgerly/shared/types';
import {
  transactionCreateSchema,
  transactionUpdateSchema,
} from '@ledgerly/shared/validation';
import {
  CreateTransactionRequestDTO,
  UpdateTransactionRequestDTO,
} from 'src/application';
import {
  CreateTransactionUseCase,
  GetTransactionByIdUseCase,
  GetAllTransactionsUseCase,
} from 'src/application/usecases/transaction/';
import { UpdateTransactionUseCase } from 'src/application/usecases/transaction/UpdateTransaction';
import { User } from 'src/domain';

export class TransactionController {
  constructor(
    private readonly createTransaction: CreateTransactionUseCase,
    private readonly getTransactionById: GetTransactionByIdUseCase,
    private readonly getAllTransactions: GetAllTransactionsUseCase,
    private readonly updateTransaction: UpdateTransactionUseCase,
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

  async update(
    user: User,
    transactionId: UUID,
    requestBody: UpdateTransactionRequestDTO,
  ) {
    const transactionUpdateDto = transactionUpdateSchema.parse(requestBody);

    return this.updateTransaction.execute(
      user,
      transactionId,
      transactionUpdateDto,
    );
  }
}
