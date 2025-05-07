import { makeAutoObservable, runInAction } from "mobx";
import { Account, AccountFormValues } from "shared/types/account";
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

  create = async (account: AccountFormValues) => {
    const response = await accountActions.create(account);

    runInAction(() => {
      if (response.ok) {
        this.data.push(response.data);
        console.log("Account created successfully: ", response.data);
      } else {
        console.error(response.error);
      }
    });
  };
}

export const accountsState = new AccountsState();
