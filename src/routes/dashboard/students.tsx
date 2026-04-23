import { createFileRoute } from "@tanstack/react-router";
import { DashboardModulePage } from "~/components/dashboard/DashboardModulePage";

export const Route = createFileRoute("/dashboard/students")({
  component: () => <DashboardModulePage module="students" />,
});
