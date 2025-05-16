import { observer } from 'mobx-react-lite';
import { accountsState } from 'src/entities/accounts/model/accountsState';

import { ManageAccountModal } from './ManageAccountModal';

export const ManageAccount = observer(() => {
  const state = accountsState.modalState;

  if (!state.isOpen) {
    return null;
  }

  return <ManageAccountModal />;
});
