import { createFileRoute } from "@tanstack/react-router";
import { IndexPage } from "src/pages/indexPage";

export const Route = createFileRoute("/")({
  component: IndexPage,
});
