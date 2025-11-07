import { transactionCreateSchema } from '@ledgerly/shared/validation';
import { CreateTransactionUseCase } from 'src/application/usecases/transaction/CreateTransaction';
import { User } from 'src/domain';

export class TransactionController {
  constructor(
    private readonly createTransactionUseCase: CreateTransactionUseCase,
  ) {}

  async create(user: User, requestBody: unknown) {
    const transactionCreateDto = transactionCreateSchema.parse(requestBody);

    return this.createTransactionUseCase.execute(user, transactionCreateDto);
  }
}
