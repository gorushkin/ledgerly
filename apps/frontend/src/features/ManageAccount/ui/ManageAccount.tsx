import { observer } from "mobx-react-lite";
import { ManageAccountModal } from "./ManageAccountModal";
import { accountsState } from "src/entities/accounts/model/accountsState";

export const ManageAccount = observer(() => {
  const state = accountsState.modalState;

  if (!state.isOpen) {
    return null;
  }

  return <ManageAccountModal state={state} />;
});
