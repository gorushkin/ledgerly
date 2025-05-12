import { useEffect } from 'react';

import { Link } from '@tanstack/react-router';
import { Wallet, Banknote, CreditCard } from 'lucide-react';
import { observer } from 'mobx-react-lite';

import { accountsState } from '../../model/accountsState';

const getAccountIcon = (type: string) => {
  switch (type) {
    case 'cash':
      return <Wallet className="w-5 h-5 mr-2" />;
    case 'bank':
      return <Banknote className="w-5 h-5 mr-2" />;
    case 'credit':
      return <CreditCard className="w-5 h-5 mr-2" />;
    default:
      return <Wallet className="w-5 h-5 mr-2" />; // Default icon
  }
};

export const AccountsList = observer(() => {
  useEffect(() => {
    void accountsState.getAll();
  }, []);

  return (
    <div>
      <h1>Accounts List</h1>
      <ul className="menu menu-sm">
        {accountsState.data.map((account) => (
          <li key={account.id}>
            <Link to="/accounts/$accountId" params={{ accountId: String(account.id) }} className="flex items-center">
              {getAccountIcon('cash')}
              {account.name}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
});
