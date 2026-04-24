import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { z } from "zod";
import { Brain, Upload, Users } from "lucide-react";
import { MistakeLibraryPage } from "~/components/dashboard/MistakeLibraryPage";
import {
  DashboardShell,
  ModuleButton,
} from "~/components/dashboard/DashboardShell";

const mistakeLibrarySearchSchema = z.object({
  classId: z.coerce.number().optional(),
});

export const Route = createFileRoute("/dashboard/mistakes")({
  validateSearch: mistakeLibrarySearchSchema,
  component: MistakeLibraryRoute,
});

function MistakeLibraryRoute() {
  const navigate = useNavigate();
  const search = mistakeLibrarySearchSchema.parse(Route.useSearch());

  return (
    <DashboardShell
      activeNav="mistakes"
      title="错题库"
      subtitle={(ctx) =>
        ctx.selectedClass
          ? `${ctx.selectedClass.name} · 聚合作业与试卷中的错题，按知识点和学生快速定位问题。`
          : "按班级查看错题、薄弱知识点和高频学生。"
      }
      selectedClassIdOverride={search.classId ?? null}
      onSelectedClassChange={(classId) => {
        void navigate({
          to: "/dashboard/mistakes",
          search: { classId },
          replace: true,
        });
      }}
      actions={(ctx) => (
        <>
          <ModuleButton icon={Upload} onClick={ctx.openUploadForSelectedClass}>
            上传作业
          </ModuleButton>
          <ModuleButton icon={Brain} onClick={ctx.openQuestionGenerator}>
            题目生成
          </ModuleButton>
          <ModuleButton icon={Users} onClick={ctx.openStudentsDashboard}>
            学生管理
          </ModuleButton>
        </>
      )}
    >
      {(ctx) => <MistakeLibraryPage ctx={ctx} />}
    </DashboardShell>
  );
}
