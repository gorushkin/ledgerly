import { UUID } from '@ledgerly/shared/types';
import {
  accountCreateSchema,
  accountUpdateSchema,
} from '@ledgerly/shared/validation';

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

  async getAll(userId: UUID) {
    return this.getAllAccountsUseCase.execute(userId);
  }

  async getById(userId: UUID, id: UUID) {
    return this.getAccountByIdUseCase.execute(userId, id);
  }

  async create(userId: UUID, requestBody: unknown) {
    const accountCreateDto = accountCreateSchema.parse(requestBody);

    return this.createAccountUseCase.execute(userId, {
      ...accountCreateDto,
      userId,
    });
  }

  async update(userId: UUID, id: UUID, requestBody: unknown) {
    const accountUpdateDto = accountUpdateSchema.parse(requestBody);

    return this.updateAccountUseCase.execute(userId, id, accountUpdateDto);
  }

  async deleteAccount(userId: UUID, id: UUID) {
    return this.deleteAccountUseCase.execute(userId, id);
  }
}
