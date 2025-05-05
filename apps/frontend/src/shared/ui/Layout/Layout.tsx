import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";
import { Header } from "./Header";
import { Footer } from "./Footer";
import { Main } from "./Main";
import { Sidebar } from "./Sidebar/Sidebar";

import { Wallet } from "lucide-react";

export const Layout = () => {
  return (
    <div className="flex min-h-screen bg-base-200">
      <div className="hidden w-64 flex-col bg-base-100 md:flex">
        {/* <div className="flex h-14 items-center  px-4">
          <h1 className="font-semibold text-lg flex items-center">
            <Wallet className="mr-2 h-5 w-5" />
            ФинТрекер
          </h1>
        </div> */}
        <Sidebar />
      </div>
      <Main />
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
