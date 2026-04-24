import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { ClassDataAnalysis } from "~/components/ClassDataAnalysis";
import { DashboardShell } from "~/components/dashboard/DashboardShell";

const learningAnalysisSearchSchema = z.object({
  classId: z.coerce.number().optional(),
});

export const Route = createFileRoute("/dashboard/learning-analysis")({
  validateSearch: learningAnalysisSearchSchema,
  component: LearningAnalysisPage,
});

function LearningAnalysisPage() {
  const search = learningAnalysisSearchSchema.parse(Route.useSearch());

  return (
    <DashboardShell
      activeNav="learning-analysis"
      title="学情分析"
      subtitle="围绕班级成绩趋势、分层表现和知识点热点进行深度观察。"
      showDateRangeBadge={false}
      showClassSelector={false}
    >
      {() => (
        <ClassDataAnalysis
          initialClassId={search.classId ?? null}
          showHeader={false}
          variant="page"
        />
      )}
    </DashboardShell>
  );
}
