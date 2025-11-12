import { UUID } from '@ledgerly/shared/types';
import { transactionCreateSchema } from '@ledgerly/shared/validation';
import { CreateTransactionRequestDTO } from 'src/application';
import {
  CreateTransactionUseCase,
  GetTransactionByIdUseCase,
  GetTransactionsByAccountIdUseCase,
} from 'src/application/usecases/transaction/';
import { User } from 'src/domain';

export class TransactionController {
  constructor(
    private readonly createTransactionUseCase: CreateTransactionUseCase,
    private readonly getTransactionByIdUseCase: GetTransactionByIdUseCase,
    private readonly getTransactionsByAccountIdUseCase: GetTransactionsByAccountIdUseCase,
  ) {}

  async create(user: User, requestBody: CreateTransactionRequestDTO) {
    const transactionCreateDto = transactionCreateSchema.parse(requestBody);

    return this.createTransactionUseCase.execute(user, transactionCreateDto);
  }

  async getById(user: User, transactionId: UUID) {
    return this.getTransactionByIdUseCase.execute(user.id, transactionId);
  }

  async getByAccountId(user: User, accountId: UUID) {
    return this.getTransactionsByAccountIdUseCase.execute(user.id, accountId);
  }
}
