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

  // async getById(id: string) {
  //   const account = await this.repo.getAccountById(id);

  //   if (!account) {
  //     throw new NotFoundError('Account not found');
  //   }

  //   return account;
  // }

  create(userId: UUID, requestBody: unknown) {
    const accountCreateDto = accountCreateSchema.parse({
      ...this.getNonNullObject(requestBody),
      userId,
    });

    return this.accountService.create(accountCreateDto);
  }

  // update(id: string, updatedAccount: AccountCreateDTO) {
  //   return this.repo.updateAccount(id, updatedAccount);
  // }

  // delete(id: string) {
  //   return this.repo.deleteAccount(id);
  // }
}
