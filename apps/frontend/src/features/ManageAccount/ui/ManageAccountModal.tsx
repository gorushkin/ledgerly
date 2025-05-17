import { observer } from 'mobx-react-lite';
import { accountsState } from 'src/entities/accounts/model/accountsState';

import { ManageAccountForm } from './ManageAccountForm';

export const ManageAccountModal = observer(() => {
  const state = accountsState.modalState;

  if (!state.isOpen) {
    return null;
  }

  return <ManageAccountForm />;
});
