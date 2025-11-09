import { transactionCreateSchema } from '@ledgerly/shared/validation';
import { CreateTransactionRequestDTO } from 'src/application';
import { CreateTransactionUseCase } from 'src/application/usecases/transaction/CreateTransaction';
import { User } from 'src/domain';

export class TransactionController {
  constructor(
    private readonly createTransactionUseCase: CreateTransactionUseCase,
  ) {}

  async create(user: User, requestBody: CreateTransactionRequestDTO) {
    const transactionCreateDto = transactionCreateSchema.parse(requestBody);

    return this.createTransactionUseCase.execute(user, transactionCreateDto);
  }
}
