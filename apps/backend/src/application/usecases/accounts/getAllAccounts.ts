import { AccountResponseDTO } from '@ledgerly/shared/types';
import { AccountQuery } from '@ledgerly/shared/validation';
import type { AccountRepositoryInterface } from 'src/application/interfaces';
import { AccountMapper } from 'src/application/mappers';
import { User } from 'src/domain/users/user.entity';

export class GetAllAccountsUseCase {
  constructor(
    protected readonly accountRepository: AccountRepositoryInterface,
  ) {}

  async execute(
    user: User,
    query: AccountQuery,
  ): Promise<AccountResponseDTO[]> {
    const accounts = await this.accountRepository.getAll(
      user.getId().valueOf(),
      query,
    );

    return accounts.map((account) =>
      AccountMapper.toResponseDTOFromSnapshot(account),
    );
  }
}
