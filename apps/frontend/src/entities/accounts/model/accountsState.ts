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

  getById = (id: string) => {
    const account = this.data.find((account) => account.id === id);
    if (account) {
      this.currentAccount = account;
      return;
    }
  };

  delete = async (id: string) => {
    const res = await accountActions.delete(id);
    console.log('res: ', res);
  };
}

export const accountsState = new AccountsState();
