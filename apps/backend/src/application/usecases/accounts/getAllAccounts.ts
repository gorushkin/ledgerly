import { AccountResponseDTO } from '@ledgerly/shared/types';
import { AccountQuery } from 'node_modules/@ledgerly/shared/src/validation/accounts';
import type { AccountRepositoryInterface } from 'src/application/interfaces';
import { AccountMapper } from 'src/application/mappers';
import { User } from 'src/domain/users/user.entity';

import { AccountUseCaseBase } from './accountBase';

export class GetAllAccountsUseCase extends AccountUseCaseBase {
  constructor(accountRepository: AccountRepositoryInterface) {
    super(accountRepository);
  }

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
