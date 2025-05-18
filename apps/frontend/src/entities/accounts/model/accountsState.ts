import type { Account, AccountDTO } from '@ledgerly/shared';
import { makeAutoObservable, runInAction } from 'mobx';
import { ModalState } from 'src/shared/lib/modalState';

import { accountActions } from '../api/accountActions';

class AccountsState {
  data: Account[] = [];
  currentAccount: Account | null = null;

  modalState = new ModalState();
  constructor() {
    makeAutoObservable(this);
  }

  resetCurrentAccount = () => {
    this.currentAccount = null;
  };

  getAll = async () => {
    const response = await accountActions.read();

    runInAction(() => {
      if (response.ok) {
        this.data = response.data;
      } else {
        console.error(response.error);
      }
    });
  };

  create = async (account: AccountDTO) => {
    const response = await accountActions.create(account);

    runInAction(() => {
      if (response.ok) {
        this.data.push(response.data);
      } else {
        console.error(response.error);
      }
    });
  };

  update = async (id: string, account: AccountDTO) => {
    const response = await accountActions.update(id, account);

    runInAction(() => {
      if (response.ok) {
        const index = this.data.findIndex((a) => a.id === id);
        if (index !== -1) {
          this.data[index] = response.data;
        }
      } else {
        console.error(response.error);
      }
    });
  };

  delete = async (id: string) => {
    const response = await accountActions.delete(id);

    runInAction(() => {
      if (response.ok) {
        this.data = this.data.filter((a) => a.id !== id);
      } else {
        console.error(response.error);
      }
    });
  };

  getById = (id: string) => {
    const account = this.data.find((account) => account.id === id);
    if (account) {
      this.currentAccount = account;
      return;
    }
  };
}

export const accountsState = new AccountsState();
