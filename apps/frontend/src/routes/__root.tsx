import { createRootRoute, Link, Outlet } from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";
import { Layout } from "../shared/ui/Layout";

export const Route = createRootRoute({
  component: Layout,
});
