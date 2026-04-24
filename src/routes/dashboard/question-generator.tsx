import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { DashboardShell } from "~/components/dashboard/DashboardShell";
import { TargetedQuestionGenerator } from "~/components/TargetedQuestionGenerator";

const questionGeneratorSearchSchema = z.object({
  classId: z.coerce.number().optional(),
});

export const Route = createFileRoute("/dashboard/question-generator")({
  validateSearch: questionGeneratorSearchSchema,
  component: QuestionGeneratorPage,
});

function QuestionGeneratorPage() {
  const search = questionGeneratorSearchSchema.parse(Route.useSearch());

  return (
    <DashboardShell
      activeNav="question-generator"
      title="智能出题"
      subtitle="基于错题与知识点薄弱项生成练习题，支持按班级或学生定向出题。"
      showDateRangeBadge={false}
      showClassSelector={false}
    >
      {() => (
        <TargetedQuestionGenerator
          classId={search.classId}
          showHeader={false}
          variant="page"
        />
      )}
    </DashboardShell>
  );
}
