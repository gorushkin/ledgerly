import { AccountCreateDTO, AccountResponseDTO } from '@ledgerly/shared/types';
import type {
  AccountRepositoryInterface,
  TransactionManagerInterface,
} from 'src/application/interfaces';
import { AccountMapper } from 'src/application/mappers';
import { Account } from 'src/domain/';
import { User } from 'src/domain/users/user.entity';
export class CreateAccountUseCase {
  constructor(
    protected readonly accountRepository: AccountRepositoryInterface,
    protected readonly transactionManager: TransactionManagerInterface,
  ) {}
  async execute(
    user: User,
    data: AccountCreateDTO,
  ): Promise<AccountResponseDTO> {
    const accountSnapshot = await this.transactionManager.run(async () => {
      const account = Account.create(
        user,
        AccountMapper.toCreateAccountProps(data),
      );

      const accountSnapshot = account.toSnapshot();

      await this.accountRepository.create(
        user.getId().valueOf(),
        accountSnapshot,
      );

      return accountSnapshot;
    });

    return AccountMapper.toResponseDTOFromSnapshot(accountSnapshot);
  }
}
