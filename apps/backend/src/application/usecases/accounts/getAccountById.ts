import { AccountResponseDTO, UUID } from '@ledgerly/shared/types';
import type { AccountRepositoryInterface } from 'src/application/interfaces';
import { AccountMapper } from 'src/application/mappers';
import { User } from 'src/domain/users/user.entity';

import { AccountUseCaseBase } from './accountBase';

export class GetAccountByIdUseCase extends AccountUseCaseBase {
  constructor(accountRepository: AccountRepositoryInterface) {
    super(accountRepository);
  }

  async execute(user: User, id: UUID): Promise<AccountResponseDTO> {
    const account = await this.ensureAccountExistsAndOwned(user, id);

    return AccountMapper.toResponseDTOFromSnapshot(account);
  }
}
