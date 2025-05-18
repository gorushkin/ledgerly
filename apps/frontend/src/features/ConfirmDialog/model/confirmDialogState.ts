import { makeAutoObservable } from 'mobx';

type ConfirmDialogConfig = {
  title: string;
  message: string;
  onConfirm: () => void;
  cancelText?: string;
  confirmText?: string;
};

class ConfirmDialogState {
  isOpen = false;
  config: ConfirmDialogConfig | null = null;

  constructor() {
    makeAutoObservable(this);
  }

  open = (config: ConfirmDialogConfig) => {
    this.config = config;
    this.isOpen = true;
  };

  close = () => {
    this.isOpen = false;
    this.config = null;
  };

  confirm = () => {
    if (this.config?.onConfirm) {
      this.config.onConfirm();
    }
    this.close();
  };
}

export const confirmDialogState = new ConfirmDialogState();
