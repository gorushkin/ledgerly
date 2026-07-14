import {
  getTransactionsQuerySchema,
  transactionCreateSchema,
  transactionUpdateSchema,
  uniqueIdSchema,
} from '@ledgerly/shared/validation';
import {
  CreateTransactionRequestDTO,
  UpdateTransactionRequestDTO,
} from 'src/application';
import {
  CreateTransactionUseCase,
  GetTransactionByIdUseCase,
  GetAllTransactionsUseCase,
  DeleteTransactionUseCase,
} from 'src/application/usecases/transaction/';
import { UpdateTransactionUseCase } from 'src/application/usecases/transaction/UpdateTransaction';
import { User } from 'src/domain';

export class TransactionController {
  constructor(
    private readonly createTransaction: CreateTransactionUseCase,
    private readonly getTransactionById: GetTransactionByIdUseCase,
    private readonly getAllTransactions: GetAllTransactionsUseCase,
    private readonly updateTransaction: UpdateTransactionUseCase,
    private readonly deleteTransaction: DeleteTransactionUseCase,
  ) {}

  async create(user: User, requestBody: CreateTransactionRequestDTO) {
    const transactionCreateDto = transactionCreateSchema.parse(requestBody);

    return this.createTransaction.execute(user, transactionCreateDto);
  }

  async getById(user: User, requestParams: unknown) {
    const { id } = uniqueIdSchema.parse(requestParams);

    return this.getTransactionById.execute(user.getId().valueOf(), id);
  }

  async getAll(user: User, requestQuery: unknown) {
    const query = getTransactionsQuerySchema.parse(requestQuery);

    return this.getAllTransactions.execute(user.getId().valueOf(), query);
  }

  async update(
    user: User,
    requestParams: unknown,
    requestBody: UpdateTransactionRequestDTO,
  ) {
    const { id } = uniqueIdSchema.parse(requestParams);
    const transactionUpdateDto = transactionUpdateSchema.parse(requestBody);

    return this.updateTransaction.execute(user, id, transactionUpdateDto);
  }

  async delete(user: User, requestParams: unknown): Promise<void> {
    const { id } = uniqueIdSchema.parse(requestParams);

    return this.deleteTransaction.execute(user, id);
  }
}
