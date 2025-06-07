import { createFileRoute } from '@tanstack/react-router';
import { AccountsPage } from 'src/pages/accountsPage';
export const Route = createFileRoute('/accounts/')({
  component: AccountsPage,
});
