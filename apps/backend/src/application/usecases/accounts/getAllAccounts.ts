import { AccountResponseDTO } from '@ledgerly/shared/types';
import { AccountRepositoryInterface } from 'src/application/interfaces';
import { User } from 'src/domain/users/user.entity';

import { AccountUseCaseBase } from './accountBase';

export class GetAllAccountsUseCase extends AccountUseCaseBase {
  constructor(accountRepository: AccountRepositoryInterface) {
    super(accountRepository);
  }

  async execute(user: User): Promise<AccountResponseDTO[]> {
    return this.accountRepository.getAll(user.id);
  }
}
