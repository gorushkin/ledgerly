import { useEffect } from "react";
import { accountsState } from "../../model/accountsState";
import { Link } from "@tanstack/react-router";
import { observer } from "mobx-react-lite";
import { toJS } from "mobx";
import { Wallet, Banknote, CreditCard } from "lucide-react";

const getAccountIcon = (type: string) => {
  switch (type) {
    case "cash":
      return <Wallet className="w-5 h-5 mr-2" />;
    case "bank":
      return <Banknote className="w-5 h-5 mr-2" />;
    case "credit":
      return <CreditCard className="w-5 h-5 mr-2" />;
    default:
      return <Wallet className="w-5 h-5 mr-2" />; // Default icon
  }
};

export const AccountsList = observer(() => {
  useEffect(() => {
    accountsState.getAll();
  }, []);

  console.log("accountsState.data: ", toJS(accountsState.data));

  return (
    <div>
      <h1>Accounts List</h1>
      <ul className="menu menu-sm">
        {accountsState.data.map((account) => (
          <li key={account.id}>
            <Link to={"/"} className="flex items-center">
              {getAccountIcon("cash")}
              {account.name}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
});
