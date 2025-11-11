import { UUID } from '@ledgerly/shared/types';
import { transactionCreateSchema } from '@ledgerly/shared/validation';
import { CreateTransactionRequestDTO } from 'src/application';
import { CreateTransactionUseCase } from 'src/application/usecases/transaction/CreateTransaction';
import { GetTransactionByIdUseCase } from 'src/application/usecases/transaction/GetTransactionById';
import { User } from 'src/domain';

export class TransactionController {
  constructor(
    private readonly createTransactionUseCase: CreateTransactionUseCase,
    private readonly getTransactionByIdUseCase: GetTransactionByIdUseCase,
  ) {}

  async create(user: User, requestBody: CreateTransactionRequestDTO) {
    const transactionCreateDto = transactionCreateSchema.parse(requestBody);

    return this.createTransactionUseCase.execute(user, transactionCreateDto);
  }

  async getById(user: User, transactionId: UUID) {
    return this.getTransactionByIdUseCase.execute(user.id, transactionId);
  }
}
