import {
  accountCreateSchema,
  accountQuerySchema,
  accountUpdateSchema,
  uniqueIdSchema,
} from '@ledgerly/shared/validation';
import {
  CloseAccountUseCase,
  DeleteAccountUseCase,
  CreateAccountUseCase,
  GetAccountByIdUseCase,
  GetAllAccountsUseCase,
  OpenAccountUseCase,
  UpdateAccountUseCase,
} from 'src/application/usecases/accounts';
import { User } from 'src/domain/users/user.entity';

export class AccountController {
  constructor(
    private readonly getAccountByIdUseCase: GetAccountByIdUseCase,
    private readonly getAllAccountsUseCase: GetAllAccountsUseCase,
    private readonly createAccountUseCase: CreateAccountUseCase,
    private readonly updateAccountUseCase: UpdateAccountUseCase,
    private readonly deleteAccountUseCase: DeleteAccountUseCase,
    private readonly closeAccountUseCase: CloseAccountUseCase,
    private readonly openAccountUseCase: OpenAccountUseCase,
  ) {}

  async getAll(user: User, query: unknown) {
    const parsedQuery = accountQuerySchema.parse(query);
    return this.getAllAccountsUseCase.execute(user, parsedQuery);
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

    return this.deleteAccountUseCase.execute(user, id);
  }

  async closeAccount(user: User, requestParams: unknown) {
    const { id } = uniqueIdSchema.parse(requestParams);

    return this.closeAccountUseCase.execute(user, id);
  }

  async openAccount(user: User, requestParams: unknown) {
    const { id } = uniqueIdSchema.parse(requestParams);

    return this.openAccountUseCase.execute(user, id);
  }
}
