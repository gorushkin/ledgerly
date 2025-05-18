import { makeAutoObservable } from 'mobx';

export class ModalState {
  isOpen = false;

  constructor() {
    makeAutoObservable(this);
  }

  open = () => {
    this.isOpen = true;
  };

  close = () => {
    this.isOpen = false;
  };
}
