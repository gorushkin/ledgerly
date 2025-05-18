import { makeAutoObservable } from 'mobx';
import { ModalState } from 'src/shared/lib/modalState';

type Handler = () => void | Promise<void>;

type ConfirmProps = {
  title: string;
  message: string;
  onConfirm?: Handler;
  onCancel?: Handler;
  cancelText?: string;
  confirmText?: string;
};

export class ConfirmDialogModalState {
  message = '';
  title = '';
  onCancel?: Handler;
  onSubmit?: Handler;
  cancelText = 'Отмена';
  confirmText = 'Удалить';

  modal = new ModalState();

  constructor() {
    makeAutoObservable(this);
  }

  openModal = (props: ConfirmProps) => {
    this.message = props.message;
    this.title = props.title;
    this.onCancel = props.onCancel;
    this.onSubmit = props.onConfirm;

    this.modal.open();
  };

  confirm = async () => {
    if (this.onSubmit) {
      await this.onSubmit();
    }
    this.close();
  };

  cancel = async () => {
    if (this.onCancel) {
      await this.onCancel();
    }
    this.close();
  };

  close = () => {
    this.modal.close();
  };

  get isOpen() {
    return this.modal.isOpen;
  }
}

export const confirmDialogState = new ConfirmDialogModalState();
