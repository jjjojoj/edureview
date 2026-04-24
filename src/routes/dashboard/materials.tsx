import { createFileRoute } from "@tanstack/react-router";
import { TeachingMaterialLibrary } from "~/components/TeachingMaterialLibrary";
import { DashboardShell } from "~/components/dashboard/DashboardShell";

export const Route = createFileRoute("/dashboard/materials")({
  component: MaterialsPage,
});

function MaterialsPage() {
  return (
    <DashboardShell
      activeNav="materials"
      title="教学资料"
      subtitle="集中维护讲义、文档、图片和知识点资料，供备课与出题复用。"
      showDateRangeBadge={false}
      showClassSelector={false}
    >
      {() => <TeachingMaterialLibrary showHeader={false} variant="page" />}
    </DashboardShell>
  );
}
