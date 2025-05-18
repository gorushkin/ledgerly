import { createFileRoute } from '@tanstack/react-router';
import { AccountsList } from 'src/entities/accounts/ui/AccountsList';

export const Route = createFileRoute('/accounts/')({
  component: RouteComponent,
  errorComponent: ErrorComponent,
  pendingComponent: PendingComponent,
});

function RouteComponent() {
  return (
    <div>
      <h1>Hello accounts!</h1>
      <p>Welcome to the accounts page.</p>
      <AccountsList />
    </div>
  );
}

function ErrorComponent() {
  return <div>Error loading route</div>;
}

function PendingComponent() {
  return <div>Loading...</div>;
}
