import {
  accountCreateSchema,
  accountUpdateSchema,
  uniqueIdSchema,
} from '@ledgerly/shared/validation';
import {
  ArchiveAccountUseCase,
  CreateAccountUseCase,
  GetAccountByIdUseCase,
  GetAllAccountsUseCase,
  UpdateAccountUseCase,
} from 'src/application/usecases/accounts';
import { User } from 'src/domain/users/user.entity';

export class AccountController {
  constructor(
    private readonly getAccountByIdUseCase: GetAccountByIdUseCase,
    private readonly getAllAccountsUseCase: GetAllAccountsUseCase,
    private readonly createAccountUseCase: CreateAccountUseCase,
    private readonly updateAccountUseCase: UpdateAccountUseCase,
    private readonly archiveAccountUseCase: ArchiveAccountUseCase,
  ) {}

  async getAll(user: User) {
    return this.getAllAccountsUseCase.execute(user);
  }

  async getById(user: User, requestParams: unknown) {
    const { id } = uniqueIdSchema.parse(requestParams);

    return this.getAccountByIdUseCase.execute(user, id);
  }

  async create(user: User, requestBody: unknown) {
    const accountCreateDto = accountCreateSchema.parse(requestBody);

    return this.createAccountUseCase.execute(user, accountCreateDto);
  }

  async update(user: User, requestParams: unknown, requestBody: unknown) {
    const { id } = uniqueIdSchema.parse(requestParams);
    const accountUpdateDto = accountUpdateSchema.parse(requestBody);

    return this.updateAccountUseCase.execute(user, id, accountUpdateDto);
  }

  async deleteAccount(user: User, requestParams: unknown) {
    const { id } = uniqueIdSchema.parse(requestParams);

    return this.archiveAccountUseCase.execute(user, id);
  }
}
