import { UUID } from '@ledgerly/shared/types';
import { accountCreateSchema } from '@ledgerly/shared/validation';
import { AccountService } from 'src/services/account.service';

export class AccountController {
  constructor(private readonly accountService: AccountService) {}

  private getNonNullObject(requestBody: unknown): object {
    return typeof requestBody === 'object' && requestBody !== null
      ? requestBody
      : {};
  }

  getAll(userId: UUID) {
    return this.accountService.getAll(userId);
  }

  getById(userId: UUID, id: string) {
    return this.accountService.getById(userId, id);
  }

  async create(userId: UUID, requestBody: unknown) {
    const accountCreateDto = accountCreateSchema.parse({
      ...this.getNonNullObject(requestBody),
      userId,
    });

    return this.accountService.create(accountCreateDto);
  }

  async update(id: UUID, updatedAccount: unknown, userId: UUID) {
    const accountUpdateDto = accountCreateSchema.parse({
      ...this.getNonNullObject(updatedAccount),
      id,
    });

    return this.accountService.update(accountUpdateDto, id, userId);
  }

  async delete(id: UUID, userId: UUID) {
    return this.accountService.delete(id, userId);
  }
}
