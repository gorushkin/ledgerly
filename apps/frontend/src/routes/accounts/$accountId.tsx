import { createFileRoute } from '@tanstack/react-router';
import { AccountPage } from 'src/pages/accountPage';

export const Route = createFileRoute('/accounts/$accountId')({
  component: AccountPage,
});
