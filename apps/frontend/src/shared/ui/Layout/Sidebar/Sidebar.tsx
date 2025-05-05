import { AccountsList } from "src/entities/accounts/ui/AccountsList";
import { AddAccountButton } from "src/features/addAccount/ui";

export const Sidebar = () => {
  return (
    <div className="flex flex-col h-full w-64 bg-blue-900 text-white p-4">
      <AccountsList />
      <AddAccountButton />
    </div>
  );
};
