import { AccountResponseDTO } from '@ledgerly/shared/types';
import { AccountRepositoryInterface } from 'src/application/interfaces';
import { AccountMapper } from 'src/application/mappers';
import { User } from 'src/domain/users/user.entity';

import { AccountUseCaseBase } from './accountBase';

export class GetAllAccountsUseCase extends AccountUseCaseBase {
  constructor(accountRepository: AccountRepositoryInterface) {
    super(accountRepository);
  }

  async execute(user: User): Promise<AccountResponseDTO[]> {
    const accounts = await this.accountRepository.getAll(user.id);

    return accounts.map((account) =>
      AccountMapper.toResponseDTO(AccountMapper.toDomain(account)),
    );
  }
}
