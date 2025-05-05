import { makeAutoObservable, runInAction } from "mobx";
import { Account } from "shared/types/account";
import { accountActions } from "../api/accountActions";

class AccountsState {
  data: Account[] = [];
  constructor() {
    makeAutoObservable(this);
  }

  getAll = async () => {
    const response = await accountActions.read();

    runInAction(() => {
      if (response.ok) {
        this.data = response.data;
        console.log("this.data: ", this.data);
      } else {
        console.error(response.error);
      }
    });
  };
}

export const accountsState = new AccountsState();
