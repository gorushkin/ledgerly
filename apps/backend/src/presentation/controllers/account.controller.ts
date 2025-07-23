import { UUID } from '@ledgerly/shared/types';
import {
  accountCreateSchema,
  accountUpdateSchema,
} from '@ledgerly/shared/validation';
import { AccountService } from 'src/services/account.service';

export class AccountController {
  constructor(private readonly accountService: AccountService) {}

  private getNonNullObject(requestBody: unknown): object {
    return typeof requestBody === 'object' && requestBody !== null
      ? requestBody
      : {};
  }

  async getAll(userId: UUID) {
    return this.accountService.getAll(userId);
  }

  async getById(userId: UUID, id: UUID) {
    return this.accountService.getById(userId, id);
  }

  async create(userId: UUID, requestBody: unknown) {
    const accountCreateDto = accountCreateSchema.parse({
      ...this.getNonNullObject(requestBody),
      userId,
    });

    return this.accountService.create(accountCreateDto);
  }

  async update(userId: UUID, id: UUID, updatedAccount: unknown) {
    const accountUpdateDto = accountUpdateSchema.parse({
      ...this.getNonNullObject(updatedAccount),
      id,
    });

    return this.accountService.update(userId, id, accountUpdateDto);
  }

  async delete(userId: UUID, id: UUID) {
    return this.accountService.delete(userId, id);
  }
}
