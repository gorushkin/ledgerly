import { Outlet } from '@tanstack/react-router';

export const Main = () => {
  return (
    <div className="flex flex-1">
      <main className="flex-1 p-4">
        <Outlet />
      </main>
    </div>
  );
};
