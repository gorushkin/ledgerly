import { AccountResponseDTO, UUID } from '@ledgerly/shared/types';
import type { AccountRepositoryInterface } from 'src/application/interfaces';
import { AccountMapper } from 'src/application/mappers';
import { EnsureOwnedSnapshotFn } from 'src/application/shared/ensureOwnedSnapshot';
import type { AccountSnapshot } from 'src/domain/accounts';
import { Account } from 'src/domain/accounts';
import { User } from 'src/domain/users/user.entity';

export class GetAccountByIdUseCase {
  constructor(
    protected readonly accountRepository: AccountRepositoryInterface,
    protected readonly ensureOwnedSnapshot: EnsureOwnedSnapshotFn,
  ) {}

  async execute(user: User, id: UUID): Promise<AccountResponseDTO> {
    const account = await this.ensureOwnedSnapshot<AccountSnapshot>({
      entityId: id,
      entityType: Account.entityType,
      getOwnerId: (account) => account.userId,
      load: this.accountRepository.getById.bind(this.accountRepository),
      user,
    });

    return AccountMapper.toResponseDTOFromSnapshot(account);
  }
}
