import { AlertTriangle } from 'lucide-react';
import { observer } from 'mobx-react-lite';
import { Button } from 'src/shared/ui/Button';
import { Modal } from 'src/shared/ui/Modal/Modal';

import { confirmDialogState } from '../model/confirmDialogState';

export const ConfirmDialog = observer(() => {
  const { close, config, confirm, isOpen } = confirmDialogState;

  if (!config) return null;

  const { cancelText = 'Отмена', confirmText = 'Удалить', message, title } = config;

  return (
    <Modal isOpen={isOpen} onClose={close} zIndex="high" maxWidth="max-w-sm">
      <Modal.Header>
        <div className="flex gap-4 items-start">
          <AlertTriangle className="w-6 h-6 text-error flex-shrink-0" />
          <h3 className="font-bold text-lg text-gray-900">{title}</h3>
        </div>
      </Modal.Header>
      <Modal.Body>
        <p className="text-gray-600">{message}</p>
      </Modal.Body>
      <Modal.Footer>
        <Button ghost onClick={close}>
          {cancelText}
        </Button>
        <Button variant="error" onClick={confirm}>
          {confirmText}
        </Button>
      </Modal.Footer>
    </Modal>
  );
});
