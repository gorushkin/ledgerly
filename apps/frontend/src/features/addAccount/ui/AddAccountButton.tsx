import { Button } from "src/shared/ui/Button";

export const AddAccountButton = () => {
  const handleAddAccount = () => {
    console.log("Adding account...");
  };

  return (
    <Button onClick={handleAddAccount} variant="primary">
      Add Account
    </Button>
  );
};
