import { JSX, useEffect } from 'react';

import { Link } from '@tanstack/react-router';
import { Wallet, Banknote, CreditCard, Pencil } from 'lucide-react';
import { observer } from 'mobx-react-lite';
import { Account } from 'shared/types/account';
import { Button } from 'src/shared/ui/Button';

import { accountsState } from '../../model/accountsState';

const iconClassName = 'w-5 h-5';

const accountIcons: Record<string, JSX.Element> = {
  bank: <Banknote className={iconClassName} />,
  cash: <Wallet className={iconClassName} />,
  credit: <CreditCard className={iconClassName} />,
  default: <Wallet className={iconClassName} />,
};

const getAccountIcon = (type: string) => accountIcons[type] || accountIcons.default;

type AccountListItemProps = {
  account: Account;
};

const AccountListItem = ({ account }: AccountListItemProps) => {
  const handleClick = () => {
    accountsState.getById(account.id);
    accountsState.modalState.open();
  };

  return (
    <li key={account.id} className="flex flex-row items-center justify-between border-b border-gray-200 w-full">
      <Link to="/accounts/$accountId" params={{ accountId: String(account.id) }} className="flex items-center grow">
        {getAccountIcon(account.type)}
        {account.name}
      </Link>
      <Button onClick={handleClick} ghost variant="info" size="sm" className="flex items-center">
        <Pencil className="w-4 h-4" />
      </Button>
    </li>
  );
};

export const AccountsList = observer(() => {
  useEffect(() => {
    void accountsState.getAll();
  }, []);

  return (
    <div>
      <h1 className="text-center">Accounts List</h1>
      <ul className="menu menu-sm w-full">
        {accountsState.data.map((account) => (
          <AccountListItem account={account} key={account.id} />
        ))}
      </ul>
    </div>
  );
});
