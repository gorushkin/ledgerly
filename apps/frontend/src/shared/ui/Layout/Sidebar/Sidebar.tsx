import { accountsState } from 'src/entities/accounts/model/accountsState';
import { AccountsList } from 'src/entities/accounts/ui/AccountsList';
import { ManageAccount } from 'src/features/ManageAccount/ui';

import { Button } from '../../Button';

export const Sidebar = () => {
  return (
    <div className="flex flex-col h-full w-64 bg-blue-900 text-white p-4">
      <AccountsList />
      <Button onClick={accountsState.modalState.open} variant="primary">
        Add Account
      </Button>
      <ManageAccount />
    </div>
  );
};
