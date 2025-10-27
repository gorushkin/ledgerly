import { UUID } from '@ledgerly/shared/types';
import {
  accountCreateSchema,
  accountUpdateSchema,
} from '@ledgerly/shared/validation';
import { User } from 'src/domain/users/user.entity';

import {
  DeleteAccountUseCase,
  CreateAccountUseCase,
  GetAccountByIdUseCase,
  GetAllAccountsUseCase,
  UpdateAccountUseCase,
} from '../../application/usecases/accounts';

export class AccountController {
  constructor(
    private readonly getAccountByIdUseCase: GetAccountByIdUseCase,
    private readonly getAllAccountsUseCase: GetAllAccountsUseCase,
    private readonly createAccountUseCase: CreateAccountUseCase,
    private readonly updateAccountUseCase: UpdateAccountUseCase,
    private readonly deleteAccountUseCase: DeleteAccountUseCase,
  ) {}

  async getAll(user: User) {
    return this.getAllAccountsUseCase.execute(user);
  }

  async getById(user: User, id: UUID) {
    return this.getAccountByIdUseCase.execute(user, id);
  }

  async create(user: User, requestBody: unknown) {
    const accountCreateDto = accountCreateSchema.parse(requestBody);

    return this.createAccountUseCase.execute(user, accountCreateDto);
  }

  async update(user: User, id: UUID, requestBody: unknown) {
    const accountUpdateDto = accountUpdateSchema.parse(requestBody);

    return this.updateAccountUseCase.execute(user, id, accountUpdateDto);
  }

  async deleteAccount(user: User, id: UUID) {
    return this.deleteAccountUseCase.execute(user, id);
  }
}
