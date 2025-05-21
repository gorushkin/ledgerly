import { useParams } from '@tanstack/react-router';

export const AccountPage = () => {
  const { accountId } = useParams({ strict: false });

  return (
    <div>
      <h1>Welcome to the Account Page</h1>
      <p>This is the account page of the application.</p>
      <p>Account ID: {accountId}</p>
    </div>
  );
};
