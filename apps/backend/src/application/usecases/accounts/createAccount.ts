import { AccountCreateDTO, AccountResponseDTO } from '@ledgerly/shared/types';
import type {
  AccountRepositoryInterface,
  TransactionManagerInterface,
} from 'src/application/interfaces';
import { AccountMapper } from 'src/application/mappers';
import { CommodityReferencePolicy } from 'src/application/services';
import { mapRepositoryAlreadyExists } from 'src/application/shared/repositoryConflictMapper';
import { Account } from 'src/domain/';
import { User } from 'src/domain/users/user.entity';
export class CreateAccountUseCase {
  constructor(
    protected readonly accountRepository: AccountRepositoryInterface,
    protected readonly transactionManager: TransactionManagerInterface,
    private readonly commodityReferencePolicy: CommodityReferencePolicy,
  ) {}
  async execute(
    user: User,
    data: AccountCreateDTO,
  ): Promise<AccountResponseDTO> {
    const accountSnapshot = await this.transactionManager.run(async () => {
      await this.commodityReferencePolicy.assertUsableForNewAccount(
        user.getId().valueOf(),
        data.commodityId,
      );

      const account = Account.create(
        user,
        AccountMapper.toCreateAccountProps(data),
      );

      const accountSnapshot = account.toSnapshot();

      await mapRepositoryAlreadyExists(
        () =>
          this.accountRepository.create(
            user.getId().valueOf(),
            accountSnapshot,
          ),
        [
          {
            entityType: 'account',
            field: 'name',
            tableName: 'accounts',
          },
        ],
      );

      return accountSnapshot;
    });

    return AccountMapper.toResponseDTOFromSnapshot(accountSnapshot);
  }
}
