import { UUID } from '@ledgerly/shared/types';
import {
  accountCreateSchema,
  accountUpdateSchema,
} from '@ledgerly/shared/validation';
import { AccountService } from 'src/services/account.service';

export class AccountController {
  constructor(private readonly accountService: AccountService) {}

  async getAll(userId: UUID) {
    return this.accountService.getAll(userId);
  }

  async getById(userId: UUID, id: UUID) {
    return this.accountService.getById(userId, id);
  }

  async create(userId: UUID, requestBody: unknown) {
    const accountCreateDto = accountCreateSchema.parse(requestBody);

    return this.accountService.create({ ...accountCreateDto, userId });
  }

  async update(userId: UUID, id: UUID, requestBody: unknown) {
    const accountUpdateDto = accountUpdateSchema.parse(requestBody);

    return this.accountService.update(userId, id, accountUpdateDto);
  }

  async delete(userId: UUID, id: UUID) {
    return this.accountService.delete(userId, id);
  }
}
