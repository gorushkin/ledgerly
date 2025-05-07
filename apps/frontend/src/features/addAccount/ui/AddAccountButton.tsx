import { observer } from "mobx-react-lite";
import { ModalState } from "src/shared/lib/modalState";
import { Button } from "src/shared/ui/Button";
import { AddAccountModal } from "./AddAccountModal";

const modalState = new ModalState();

export const AddAccountButton = observer(() => {
  const handleAddAccount = () => {
    modalState.open();
  };

  return (
    <>
      {modalState.isOpen && <AddAccountModal state={modalState} />}
      <Button onClick={handleAddAccount} variant="primary">
        Add Account
      </Button>
    </>
  );
});
