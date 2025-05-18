import { TanStackRouterDevtools } from '@tanstack/react-router-devtools';
import { ConfirmDialog } from 'src/features/ConfirmDialog';

import { Footer } from './Footer';
import { Header } from './Header';
import { Main } from './Main';
import { Sidebar } from './Sidebar/Sidebar';

export const Layout = () => {
  return (
    <div className="flex min-h-screen bg-base-200">
      <div className="hidden w-64 flex-col bg-base-100 md:flex">
        <Sidebar />
      </div>
      <Main />
      <ConfirmDialog />
    </div>
  );
};

export const Layout2 = () => {
  return (
    <div className="flex flex-col h-screen green">
      <Header />
      <div className="flex flex-1 ">
        <Sidebar />
        <Main />
      </div>
      <Footer />
      <TanStackRouterDevtools />
    </div>
  );
};
