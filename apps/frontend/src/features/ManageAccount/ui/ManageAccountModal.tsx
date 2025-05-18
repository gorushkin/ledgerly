import { observer } from 'mobx-react-lite';
import { accountsState } from 'src/entities/accounts/model/accountsState';
import { confirmDialogState } from 'src/features/ConfirmDialog';
import { Button } from 'src/shared/ui/Button';
import { Modal } from 'src/shared/ui/Modal/Modal';

import { ManageAccountForm } from './ManageAccountForm';

export const ManageAccountModal = observer(() => {
  const { currentAccount, modalState } = accountsState;
  const isEditMode = Boolean(currentAccount);

  const FORM_ID = 'manage-account-form';

  if (!modalState.isOpen) {
    return null;
  }

  const title = currentAccount ? 'Редактировать счет' : 'Добавить новый счет';

  const handleClose = () => {
    accountsState.resetCurrentAccount();
    modalState.close();
  };

  const onDeleteClick = () => {
    if (!currentAccount) return;

    confirmDialogState.open({
      message: `Вы уверены, что хотите удалить счет "${currentAccount.name}"?`,
      onConfirm: () => {
        void accountsState.delete(currentAccount.id);
        handleClose();
      },
      title: 'Удалить счет',
    });
  };

  return (
    <Modal isOpen={modalState.isOpen} onClose={modalState.close}>
      <Modal.Header title={title} />
      <Modal.Body>
        <ManageAccountForm formId={FORM_ID} />
      </Modal.Body>
      <Modal.Footer>
        {isEditMode && (
          <Button variant="error" outline onClick={onDeleteClick}>
            Удалить счет
          </Button>
        )}
        <div className="flex gap-3 ml-auto">
          <Button ghost onClick={handleClose}>
            Отмена
          </Button>
          <Button type="submit" form={FORM_ID} variant="primary">
            {isEditMode ? 'Сохранить' : 'Создать'}
          </Button>
        </div>
      </Modal.Footer>
    </Modal>
  );
});
