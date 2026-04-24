import { useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery } from "@tanstack/react-query";
import { lazy, Suspense, useMemo, useState } from "react";
import {
  AlertCircle,
  Archive,
  Award,
  BarChart3,
  BookOpen,
  Brain,
  CheckCircle2,
  ChevronRight,
  ClipboardCheck,
  Clock,
  FileBarChart,
  FileText,
  GraduationCap,
  LibraryBig,
  MessageSquareText,
  PieChart,
  Plus,
  ShieldCheck,
  Target,
  TrendingDown,
  TrendingUp,
  Upload,
  UserPlus,
  Users,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { AddStudentModal } from "~/components/AddStudentModal";
import { ConfirmDialog } from "~/components/ConfirmDialog";
import { GroupSelectionModal } from "~/components/GroupSelectionModal";
import { ModalWrapper } from "~/components/ModalWrapper";
import {
  ClassStudents,
  type ClassStudentRecord,
} from "~/components/class/ClassStudents";
import {
  DashboardShell,
  EmptyState,
  formatDelta,
  formatPercent,
  MetricCard,
  MiniBars,
  ModuleButton,
  Panel,
  RankIndicator,
  TrendChart,
  type DashboardNavKey,
  type DashboardPageContext,
} from "~/components/dashboard/DashboardShell";
import { useToast } from "~/components/Toast";
import { useTRPC } from "~/trpc/react";
import { getErrorMessage } from "~/utils/trpcError";

const ReportGenerationModal = lazy(() =>
  import("~/components/ReportGenerationModal").then((m) => ({
    default: m.ReportGenerationModal,
  })),
);

export type DashboardModule =
  | "learning-analysis"
  | "grades"
  | "assignments"
  | "exams"
  | "knowledge-map"
  | "students"
  | "classes"
  | "reports"
  | "messages"
  | "settings";

const moduleCopy: Record<
  DashboardModule,
  {
    title: string;
    subtitle: string;
  }
> = {
  "learning-analysis": {
    title: "学情分析",
    subtitle: "围绕成绩趋势、参与度与薄弱点组织课堂决策。",
  },
  grades: {
    title: "成绩管理",
    subtitle: "集中查看学生成绩、排名与班级分布。",
  },
  assignments: {
    title: "作业分析",
    subtitle: "追踪作业提交、评分与错因反馈。",
  },
  exams: {
    title: "试卷分析",
    subtitle: "查看试卷成绩表现、失分点与改进方向。",
  },
  "knowledge-map": {
    title: "知识图谱",
    subtitle: "按知识点聚合掌握度、错题与影响学生。",
  },
  students: {
    title: "学生管理",
    subtitle: "维护学生名单、关注对象与学习记录。",
  },
  classes: {
    title: "班级管理",
    subtitle: "管理班级档案、学生规模与课堂入口。",
  },
  reports: {
    title: "报告中心",
    subtitle: "生成班级报告、学生报告与学情汇总。",
  },
  messages: {
    title: "消息中心",
    subtitle: "汇总系统提醒、学情预警和待处理事项。",
  },
  settings: {
    title: "设置中心",
    subtitle: "管理账号、权限、数据与系统偏好。",
  },
};

export function DashboardModulePage({ module }: { module: DashboardModule }) {
  const copy = moduleCopy[module];

  return (
    <DashboardShell
      activeNav={module as DashboardNavKey}
      title={copy.title}
      subtitle={copy.subtitle}
      actions={(ctx) => <ModuleActions module={module} ctx={ctx} />}
      showCreateClassButton={module !== "classes"}
    >
      {(ctx) => <ModuleContent module={module} ctx={ctx} />}
    </DashboardShell>
  );
}

function ModuleActions({
  module,
  ctx,
}: {
  module: DashboardModule;
  ctx: DashboardPageContext;
}) {
  switch (module) {
    case "learning-analysis":
      return (
        <>
          <ModuleButton icon={Target} onClick={ctx.openMistakeLibrary}>
            错题库
          </ModuleButton>
          <ModuleButton icon={Brain} onClick={ctx.openQuestionGenerator}>
            智能出题
          </ModuleButton>
        </>
      );
    case "grades":
      return (
        <>
          <ModuleButton icon={Users} onClick={ctx.openStudentsDashboard}>
            学生管理
          </ModuleButton>
          <ModuleButton icon={PieChart} onClick={ctx.openReportsDashboard}>
            报告中心
          </ModuleButton>
        </>
      );
    case "assignments":
      return (
        <>
          <ModuleButton icon={Target} onClick={ctx.openMistakeLibrary}>
            错题库
          </ModuleButton>
          <ModuleButton icon={Brain} onClick={ctx.openQuestionGenerator}>
            智能出题
          </ModuleButton>
        </>
      );
    case "exams":
      return (
        <>
          <ModuleButton icon={BarChart3} onClick={ctx.openDataAnalysis}>
            学情分析
          </ModuleButton>
          <ModuleButton icon={PieChart} onClick={ctx.openReportsDashboard}>
            报告中心
          </ModuleButton>
        </>
      );
    case "knowledge-map":
      return (
        <>
          <ModuleButton icon={LibraryBig} onClick={ctx.openTeachingMaterials}>
            教学资料
          </ModuleButton>
          <ModuleButton icon={Brain} onClick={ctx.openQuestionGenerator}>
            智能出题
          </ModuleButton>
        </>
      );
    case "students":
      return (
        <>
          <ModuleButton icon={BarChart3} onClick={ctx.openDataAnalysis}>
            学情分析
          </ModuleButton>
          <ModuleButton icon={BookOpen} onClick={ctx.openSelectedClass}>
            班级工作台
          </ModuleButton>
        </>
      );
    case "classes":
      return (
        <ModuleButton icon={Plus} tone="primary" onClick={ctx.openCreateClass}>
          新建班级
        </ModuleButton>
      );
    case "reports":
      return (
        <>
          <ModuleButton icon={BarChart3} onClick={ctx.openDataAnalysis}>
            学情分析
          </ModuleButton>
          <ModuleButton icon={Users} onClick={ctx.openStudentsDashboard}>
            学生管理
          </ModuleButton>
        </>
      );
    case "messages":
      return (
        <ModuleButton icon={Clock} onClick={ctx.openReviewSchedule}>
          复习安排
        </ModuleButton>
      );
    case "settings":
      return (
        <ModuleButton icon={BookOpen} onClick={ctx.openClassesDashboard}>
          班级管理
        </ModuleButton>
      );
    default:
      return null;
  }
}

function ModuleContent({
  module,
  ctx,
}: {
  module: DashboardModule;
  ctx: DashboardPageContext;
}) {
  const trpc = useTRPC();
  const navigate = useNavigate();
  const toast = useToast();
  const [showReportModal, setShowReportModal] = useState(false);
  const [showAddStudentModal, setShowAddStudentModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showGroupModal, setShowGroupModal] = useState(false);
  const [selectedStudent, setSelectedStudent] =
    useState<ClassStudentRecord | null>(null);

  const studentsQuery = useQuery({
    ...trpc.getClassStudents.queryOptions({
      authToken: ctx.authToken || "",
      classId: ctx.selectedClassId,
    }),
    enabled: !!ctx.authToken && !!ctx.selectedClassId,
  });

  const groupsQuery = useQuery({
    ...trpc.getClassGroups.queryOptions({
      authToken: ctx.authToken || "",
      classId: ctx.selectedClassId,
    }),
    enabled: module === "students" && !!ctx.authToken && !!ctx.selectedClassId,
  });

  const deleteStudentMutation = useMutation(
    trpc.deleteStudentFromClass.mutationOptions(),
  );
  const toggleSpecialAttentionMutation = useMutation(
    trpc.toggleSpecialAttention.mutationOptions(),
  );
  const assignStudentToGroupMutation = useMutation(
    trpc.assignStudentToGroup.mutationOptions(),
  );
  const createStudentGroupMutation = useMutation(
    trpc.createStudentGroup.mutationOptions(),
  );

  const students = studentsQuery.data?.students || [];
  const groups = groupsQuery.data?.groups || [];
  const totalMistakes = students.reduce(
    (sum, student) =>
      sum + student._count.mistakes + student._count.examMistakes,
    0,
  );
  const specialStudents = students.filter(
    (student) => student.specialAttention,
  );
  const avgItemsPerStudent =
    students.length > 0
      ? (ctx.selectedClass?._count.assignments || 0) / students.length
      : null;

  const handleDeleteStudent = (student: ClassStudentRecord) => {
    setSelectedStudent(student);
    setShowDeleteConfirm(true);
  };

  const confirmDeleteStudent = async () => {
    if (!selectedStudent || !ctx.authToken) return;

    try {
      await deleteStudentMutation.mutateAsync({
        authToken: ctx.authToken,
        studentId: selectedStudent.id,
      });
      toast.success(`已删除学生 ${selectedStudent.name}`);
      setShowDeleteConfirm(false);
      setSelectedStudent(null);
      void Promise.all([studentsQuery.refetch(), groupsQuery.refetch()]);
    } catch (error: unknown) {
      toast.error(getErrorMessage(error));
    }
  };

  const handleSpecialAttention = async (student: ClassStudentRecord) => {
    if (!ctx.authToken) return;

    try {
      const result = await toggleSpecialAttentionMutation.mutateAsync({
        authToken: ctx.authToken,
        studentId: student.id,
      });
      const actionText = result.action === "added" ? "加入" : "取消";
      toast.success(`已${actionText}重点关注：${student.name}`);
      void studentsQuery.refetch();
    } catch (error: unknown) {
      toast.error(getErrorMessage(error));
    }
  };

  const handleAssignToGroup = async (
    studentId: number,
    groupId: number | null,
  ) => {
    if (!ctx.authToken) return;

    try {
      const result = await assignStudentToGroupMutation.mutateAsync({
        authToken: ctx.authToken,
        studentId,
        groupId,
      });
      const actionText =
        result.action === "assigned" ? "分配到小组" : "移出小组";
      toast.success(
        `学生 ${result.student.name} 已${actionText}${result.student.groupName ? `：${result.student.groupName}` : ""}`,
      );
      await Promise.all([studentsQuery.refetch(), groupsQuery.refetch()]);
    } catch (error: unknown) {
      toast.error(getErrorMessage(error));
      throw error;
    }
  };

  const handleCreateGroup = async (
    name: string,
    description?: string,
    color: string = "blue",
  ) => {
    if (!ctx.authToken) return;

    try {
      const result = await createStudentGroupMutation.mutateAsync({
        authToken: ctx.authToken,
        classId: ctx.selectedClassId,
        name,
        description,
        color,
      });
      toast.success(`已创建小组 ${result.group.name}`);
      await groupsQuery.refetch();
    } catch (error: unknown) {
      toast.error(getErrorMessage(error));
      throw error;
    }
  };

  const gradeBands = useMemo(() => {
    const bands = [
      { label: "优秀", min: 90, color: "bg-emerald-500", count: 0 },
      { label: "良好", min: 80, color: "bg-blue-500", count: 0 },
      { label: "中等", min: 70, color: "bg-violet-500", count: 0 },
      { label: "待提升", min: 0, color: "bg-orange-500", count: 0 },
    ];

    ctx.studentRanking.forEach((student) => {
      const band = bands.find((item) => student.averageScore >= item.min);
      if (!band) return;
      band.count += 1;
    });

    return bands;
  }, [ctx.studentRanking]);

  const commonMetrics = (
    <section className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <MetricCard
        title="班级平均分"
        value={ctx.averageScore === null ? "--" : ctx.averageScore.toFixed(1)}
        caption={ctx.selectedClass?.name || "暂无班级"}
        trend={formatDelta(ctx.scoreDelta, "分")}
        tone={
          ctx.scoreDelta === null
            ? "neutral"
            : ctx.scoreDelta >= 0
              ? "up"
              : "down"
        }
        icon={Award}
        iconClassName="bg-blue-500"
      />
      <MetricCard
        title="及格率"
        value={formatPercent(ctx.passingRate)}
        caption="60 分及以上"
        trend="保持跟踪"
        tone="up"
        icon={CheckCircle2}
        iconClassName="bg-emerald-500"
      />
      <MetricCard
        title="错题总量"
        value={totalMistakes ? `${totalMistakes}` : "--"}
        caption="作业与试卷错题"
        trend={totalMistakes ? "需归因" : "暂无"}
        tone={totalMistakes ? "down" : "neutral"}
        icon={Target}
        iconClassName="bg-orange-500"
      />
      <MetricCard
        title="重点关注"
        value={`${specialStudents.length}`}
        caption="特别关注学生"
        trend={specialStudents.length ? "跟进中" : "稳定"}
        tone={specialStudents.length ? "down" : "up"}
        icon={Users}
        iconClassName="bg-violet-500"
      />
    </section>
  );

  return (
    <>
      {module !== "classes" && module !== "settings" && module !== "students"
        ? commonMetrics
        : null}

      {module === "learning-analysis" ? (
        <LearningAnalysis ctx={ctx} gradeBands={gradeBands} />
      ) : null}
      {module === "grades" ? (
        <GradesManagement ctx={ctx} gradeBands={gradeBands} />
      ) : null}
      {module === "assignments" ? (
        <AssignmentAnalysis ctx={ctx} avgItemsPerStudent={avgItemsPerStudent} />
      ) : null}
      {module === "exams" ? <ExamAnalysis ctx={ctx} /> : null}
      {module === "knowledge-map" ? <KnowledgeMap ctx={ctx} /> : null}
      {module === "students" ? (
        <StudentManagement
          ctx={ctx}
          students={students}
          isLoading={studentsQuery.isLoading}
          groups={groups}
          onShowAddStudentModal={() => setShowAddStudentModal(true)}
          onDeleteStudent={handleDeleteStudent}
          onSpecialAttention={(student) => {
            void handleSpecialAttention(student);
          }}
          onAddToGroup={(student) => {
            setSelectedStudent(student);
            setShowGroupModal(true);
          }}
        />
      ) : null}
      {module === "classes" ? (
        <ClassManagement ctx={ctx} navigate={navigate} />
      ) : null}
      {module === "reports" ? (
        <ReportCenter ctx={ctx} onShowReport={() => setShowReportModal(true)} />
      ) : null}
      {module === "messages" ? <MessageCenter ctx={ctx} /> : null}
      {module === "settings" ? <SettingsCenter ctx={ctx} /> : null}

      {ctx.selectedClass ? (
        <ModalWrapper
          isOpen={showReportModal}
          onClose={() => setShowReportModal(false)}
          maxWidth="max-w-4xl"
        >
          <Suspense
            fallback={
              <div className="flex items-center justify-center p-8 text-slate-500">
                加载中...
              </div>
            }
          >
            <ReportGenerationModal
              isOpen={showReportModal}
              onClose={() => setShowReportModal(false)}
              classId={ctx.selectedClass.id}
              className={ctx.selectedClass.name}
            />
          </Suspense>
        </ModalWrapper>
      ) : null}

      {module === "students" && ctx.selectedClass ? (
        <>
          <AddStudentModal
            isOpen={showAddStudentModal}
            onClose={() => setShowAddStudentModal(false)}
            classId={ctx.selectedClass.id}
            onSuccess={() => {
              void Promise.all([
                studentsQuery.refetch(),
                groupsQuery.refetch(),
              ]);
              toast.success("学生添加成功");
            }}
          />

          <ConfirmDialog
            isOpen={showDeleteConfirm}
            title="确认删除学生"
            message={
              <>
                您确定要删除学生{" "}
                <span className="font-semibold text-slate-900">
                  {selectedStudent?.name}
                </span>{" "}
                吗？
                <p className="mt-2 text-sm text-red-600">
                  此操作会永久删除该学生的作业、试卷和错题记录，无法恢复。
                </p>
              </>
            }
            confirmLabel="确认删除"
            cancelLabel="取消"
            destructive
            isLoading={deleteStudentMutation.isPending}
            onConfirm={() => {
              void confirmDeleteStudent();
            }}
            onCancel={() => {
              setShowDeleteConfirm(false);
              setSelectedStudent(null);
            }}
          />

          {selectedStudent ? (
            <GroupSelectionModal
              isOpen={showGroupModal}
              onClose={() => {
                setShowGroupModal(false);
                setSelectedStudent(null);
              }}
              student={selectedStudent}
              groups={groups}
              onAssignToGroup={handleAssignToGroup}
              onCreateGroup={handleCreateGroup}
            />
          ) : null}
        </>
      ) : null}
    </>
  );
}

function LearningAnalysis({
  ctx,
  gradeBands,
}: {
  ctx: DashboardPageContext;
  gradeBands: Array<{ label: string; color: string; count: number }>;
}) {
  return (
    <section className="grid grid-cols-1 gap-6 xl:grid-cols-12">
      <Panel
        title="学情趋势"
        subtitle="成绩变化与年级基准同步观察"
        className="xl:col-span-8"
      >
        <TrendChart
          data={ctx.trendChartData}
          showPreviewBadge={!ctx.hasPerformanceData}
        />
      </Panel>
      <Panel
        title="成绩分层"
        subtitle="按近期平均分自动归档"
        className="xl:col-span-4"
      >
        <div className="space-y-4">
          {gradeBands.map((band) => {
            const ratio = ctx.studentRanking.length
              ? (band.count / ctx.studentRanking.length) * 100
              : 0;
            return (
              <div key={band.label}>
                <div className="mb-2 flex items-center justify-between text-sm">
                  <span className="font-bold text-slate-800">{band.label}</span>
                  <span className="text-slate-500">{band.count} 人</span>
                </div>
                <div className="h-2 rounded-full bg-slate-100">
                  <div
                    className={`h-2 rounded-full ${band.color}`}
                    style={{ width: `${ratio}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </Panel>
    </section>
  );
}

function GradesManagement({
  ctx,
  gradeBands,
}: {
  ctx: DashboardPageContext;
  gradeBands: Array<{ label: string; color: string; count: number }>;
}) {
  return (
    <section className="grid grid-cols-1 gap-6 xl:grid-cols-12">
      <Panel
        title="成绩排名"
        subtitle="点击学生可进入个人画像"
        className="xl:col-span-8"
      >
        {ctx.studentRanking.length > 0 ? (
          <div className="overflow-hidden rounded-lg border border-slate-100">
            <table className="w-full table-fixed text-sm">
              <thead className="bg-slate-50 text-xs text-slate-500">
                <tr>
                  <th className="w-16 px-4 py-3 text-left">排名</th>
                  <th className="px-4 py-3 text-left">学生</th>
                  <th className="w-24 px-4 py-3 text-right">作业均分</th>
                  <th className="w-24 px-4 py-3 text-right">试卷均分</th>
                  <th className="w-24 px-4 py-3 text-right">总均分</th>
                  <th className="w-28 px-4 py-3 text-right">趋势</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {ctx.studentRanking.map((student, index) => (
                  <tr
                    key={student.studentId}
                    onClick={() => ctx.openSelectedStudent(student.studentId)}
                    className="cursor-pointer hover:bg-blue-50/60"
                  >
                    <td className="px-4 py-3">
                      <RankIndicator rank={index + 1} />
                    </td>
                    <td className="truncate px-4 py-3 font-bold text-slate-800">
                      {student.studentName}
                    </td>
                    <td className="px-4 py-3 text-right text-slate-600">
                      {student.assignmentAvg.toFixed(1)}
                    </td>
                    <td className="px-4 py-3 text-right text-slate-600">
                      {student.examAvg.toFixed(1)}
                    </td>
                    <td className="px-4 py-3 text-right font-bold text-slate-900">
                      {student.averageScore.toFixed(1)}
                    </td>
                    <td className="px-4 py-3">
                      <MiniBars
                        seed={student.studentId + index}
                        score={student.averageScore}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState
            icon={FileBarChart}
            title="暂无成绩记录"
            description="完成作业或试卷分析后，成绩表会自动出现。"
          />
        )}
      </Panel>
      <Panel
        title="分数段统计"
        subtitle="近期表现结构"
        className="xl:col-span-4"
      >
        <div className="space-y-3">
          {gradeBands.map((band) => (
            <div
              key={band.label}
              className="flex items-center justify-between rounded-lg bg-slate-50 px-4 py-3"
            >
              <div className="flex items-center gap-3">
                <span className={`h-3 w-3 rounded-full ${band.color}`} />
                <span className="text-sm font-bold text-slate-800">
                  {band.label}
                </span>
              </div>
              <span className="text-sm font-bold text-slate-900">
                {band.count} 人
              </span>
            </div>
          ))}
        </div>
      </Panel>
    </section>
  );
}

function AssignmentAnalysis({
  ctx,
  avgItemsPerStudent,
}: {
  ctx: DashboardPageContext;
  avgItemsPerStudent: number | null;
}) {
  return (
    <section className="grid grid-cols-1 gap-6 xl:grid-cols-12">
      <Panel
        title="作业表现"
        subtitle="完成、评分与错因在这里集中观察"
        className="xl:col-span-7"
      >
        <div className="grid gap-4 sm:grid-cols-3">
          <CompactStat
            label="作业总量"
            value={`${ctx.selectedClass?._count.assignments || 0}`}
            icon={ClipboardCheck}
          />
          <CompactStat
            label="人均作业"
            value={
              avgItemsPerStudent === null ? "--" : avgItemsPerStudent.toFixed(1)
            }
            icon={Users}
          />
          <CompactStat
            label="完成率"
            value={formatPercent(ctx.completionRate)}
            icon={CheckCircle2}
          />
        </div>
        <div className="mt-6">
          <TrendChart
            data={ctx.trendChartData}
            showPreviewBadge={!ctx.hasPerformanceData}
          />
        </div>
      </Panel>
      <Panel title="作业行动" subtitle="常用处理入口" className="xl:col-span-5">
        <ActionList
          items={[
            {
              icon: Upload,
              title: "上传或批量分析作业",
              text: "进入当前班级，继续处理学生提交记录。",
              onClick: ctx.openUploadForSelectedClass,
            },
            {
              icon: Brain,
              title: "基于错题生成练习",
              text: "针对薄弱知识点生成巩固题。",
              onClick: ctx.openQuestionGenerator,
            },
            {
              icon: Target,
              title: "查看错题库",
              text: "按学生、知识点和来源过滤作业错题。",
              onClick: ctx.openMistakeLibrary,
            },
          ]}
        />
      </Panel>
    </section>
  );
}

function ExamAnalysis({ ctx }: { ctx: DashboardPageContext }) {
  return (
    <section className="grid grid-cols-1 gap-6 xl:grid-cols-12">
      <Panel
        title="试卷概况"
        subtitle="考试数量与平均表现"
        className="xl:col-span-5"
      >
        <div className="grid gap-4">
          <CompactStat
            label="试卷总量"
            value={`${ctx.selectedClass?._count.exams || 0}`}
            icon={FileText}
          />
          <CompactStat
            label="试卷均分"
            value={
              ctx.performanceData?.summary.averageExamScore
                ? ctx.performanceData.summary.averageExamScore.toFixed(1)
                : "--"
            }
            icon={Award}
          />
          <CompactStat
            label="及格率"
            value={formatPercent(ctx.passingRate)}
            icon={CheckCircle2}
          />
        </div>
      </Panel>
      <Panel
        title="试卷趋势"
        subtitle="近期考试与年级基准"
        className="xl:col-span-7"
      >
        <TrendChart
          data={ctx.trendChartData}
          showPreviewBadge={!ctx.hasPerformanceData}
        />
      </Panel>
    </section>
  );
}

function KnowledgeMap({ ctx }: { ctx: DashboardPageContext }) {
  return (
    <section className="grid grid-cols-1 gap-6 xl:grid-cols-12">
      <Panel
        title="知识点掌握"
        subtitle="按错题频次估算掌握情况"
        className="xl:col-span-8"
      >
        {ctx.knowledgeAreas.length > 0 ? (
          <div className="space-y-3">
            {ctx.knowledgeAreas.map((area) => (
              <div
                key={area.knowledgeAreaId}
                className="grid gap-3 rounded-lg border border-slate-100 px-4 py-3 sm:grid-cols-[1fr_180px_72px]"
              >
                <div>
                  <div className="text-sm font-bold text-slate-900">
                    {area.name}
                  </div>
                  <div className="mt-1 text-xs text-slate-500">
                    {area.affectedStudentCount} 名学生，{area.mistakeCount}{" "}
                    次错题
                  </div>
                </div>
                <div className="flex items-center">
                  <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                    <div
                      className="h-full rounded-full bg-blue-500"
                      style={{ width: `${area.mastery}%` }}
                    />
                  </div>
                </div>
                <div className="text-right text-sm font-bold text-slate-900">
                  {area.mastery.toFixed(1)}%
                </div>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState
            icon={Brain}
            title="暂无知识点"
            description="错题完成知识点归类后，图谱会自动聚合薄弱领域。"
          />
        )}
      </Panel>
      <Panel
        title="知识点行动"
        subtitle="资料、错题与练习联动"
        className="xl:col-span-4"
      >
        <ActionList
          items={[
            {
              icon: LibraryBig,
              title: "维护教学资料",
              text: "补充讲义、题型和知识点材料。",
              onClick: ctx.openTeachingMaterials,
            },
            {
              icon: Target,
              title: "查看错题明细",
              text: "定位薄弱知识点的原题与答案。",
              onClick: ctx.openMistakeLibrary,
            },
            {
              icon: Brain,
              title: "生成针对练习",
              text: "把薄弱点转成可练习题目。",
              onClick: ctx.openQuestionGenerator,
            },
          ]}
        />
      </Panel>
    </section>
  );
}

function StudentManagement({
  ctx,
  students,
  groups,
  isLoading,
  onShowAddStudentModal,
  onDeleteStudent,
  onSpecialAttention,
  onAddToGroup,
}: {
  ctx: DashboardPageContext;
  students: ClassStudentRecord[];
  groups: Array<{
    id: number;
    name: string;
    _count: { students: number };
  }>;
  isLoading: boolean;
  onShowAddStudentModal: () => void;
  onDeleteStudent: (student: ClassStudentRecord) => void;
  onSpecialAttention: (student: ClassStudentRecord) => void;
  onAddToGroup: (student: ClassStudentRecord) => void;
}) {
  const focusedCount = students.filter(
    (student) => student.specialAttention,
  ).length;
  const groupedCount = students.filter((student) => student.group).length;
  const totalRecords = students.reduce(
    (sum, student) => sum + student._count.assignments + student._count.exams,
    0,
  );

  if (isLoading) {
    return <EmptyState icon={Users} title="学生数据加载中" description=" " />;
  }

  return (
    <section className="grid grid-cols-1 gap-6 xl:grid-cols-12">
      <div className="xl:col-span-8">
        <ClassStudents
          students={students}
          onStudentClick={ctx.openSelectedStudent}
          onDeleteStudent={onDeleteStudent}
          onSpecialAttention={onSpecialAttention}
          onAddToGroup={onAddToGroup}
          onShowAddStudentModal={onShowAddStudentModal}
        />
      </div>

      <div className="space-y-6 xl:col-span-4">
        <Panel
          title="管理概览"
          subtitle={
            ctx.selectedClass
              ? `${ctx.selectedClass.name} 当前学生状态`
              : "暂无班级"
          }
        >
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
            <CompactStat
              label="学生总数"
              value={`${students.length}`}
              icon={Users}
            />
            <CompactStat
              label="已分组"
              value={`${groupedCount}`}
              icon={BookOpen}
            />
            <CompactStat
              label="重点关注"
              value={`${focusedCount}`}
              icon={Target}
            />
            <CompactStat
              label="学习记录"
              value={`${totalRecords}`}
              icon={ClipboardCheck}
            />
          </div>
        </Panel>

        <Panel title="本页可直接完成" subtitle="不用再跳到班级详情才能管理学生">
          <ActionList
            items={[
              {
                icon: UserPlus,
                title: "添加或批量导入学生",
                text: "直接在当前页面补充名单，支持单个添加和批量导入。",
                onClick: onShowAddStudentModal,
              },
              {
                icon: BookOpen,
                title: "进入班级工作台",
                text:
                  groups.length > 0
                    ? `当前已建立 ${groups.length} 个小组，班级页里还能继续处理上传和邀请码。`
                    : "需要处理上传、邀请码或班级级别动作时，可以进入班级工作台。",
                onClick: ctx.openSelectedClass,
              },
              {
                icon: BarChart3,
                title: "查看班级学情",
                text: "学生名单、关注对象和成绩趋势现在可以联动查看。",
                onClick: ctx.openDataAnalysis,
              },
            ]}
          />
        </Panel>
      </div>
    </section>
  );
}

function ClassManagement({
  ctx,
  navigate,
}: {
  ctx: DashboardPageContext;
  navigate: ReturnType<typeof useNavigate>;
}) {
  return (
    <>
      <section className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <MetricCard
          title="班级总数"
          value={`${ctx.classes.length}`}
          caption="当前教师账号"
          trend="运行中"
          tone="up"
          icon={BookOpen}
          iconClassName="bg-blue-500"
        />
        <MetricCard
          title="学生总数"
          value={`${ctx.totalStudents}`}
          caption="所有班级合计"
          trend="持续更新"
          tone="up"
          icon={Users}
          iconClassName="bg-emerald-500"
        />
        <MetricCard
          title="学习记录"
          value={`${ctx.totalAssignments + ctx.totalExams}`}
          caption="作业与试卷"
          trend="可分析"
          tone="up"
          icon={Archive}
          iconClassName="bg-violet-500"
        />
      </section>

      <Panel title="班级列表" subtitle="点击进入班级详情">
        {ctx.classes.length > 0 ? (
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
            {ctx.classes.map((cls) => (
              <button
                key={cls.id}
                onClick={() =>
                  void navigate({
                    to: "/classes/$classId",
                    params: { classId: cls.id.toString() },
                  })
                }
                className="rounded-lg border border-slate-100 bg-slate-50 p-4 text-left transition hover:border-blue-200 hover:bg-blue-50"
              >
                <div className="mb-3 flex items-start justify-between">
                  <div>
                    <h4 className="font-bold text-slate-900">{cls.name}</h4>
                    <p className="mt-1 line-clamp-2 text-xs text-slate-500">
                      {cls.description || "暂无班级描述"}
                    </p>
                  </div>
                  <ChevronRight className="h-5 w-5 text-slate-300" />
                </div>
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <span>{cls._count.students} 学生</span>
                  <span>{cls._count.assignments} 作业</span>
                  <span>{cls._count.exams} 试卷</span>
                </div>
              </button>
            ))}
          </div>
        ) : (
          <EmptyState
            icon={BookOpen}
            title="暂无班级"
            description="创建班级后，班级管理会展示档案与入口。"
          />
        )}
      </Panel>
    </>
  );
}

function ReportCenter({
  ctx,
  onShowReport,
}: {
  ctx: DashboardPageContext;
  onShowReport: () => void;
}) {
  return (
    <section className="grid grid-cols-1 gap-6 xl:grid-cols-12">
      <Panel
        title="报告生成"
        subtitle="面向课堂复盘和家校沟通"
        className="xl:col-span-5"
      >
        <ActionList
          items={[
            {
              icon: FileText,
              title: "生成班级报告",
              text: ctx.selectedClass?.name || "请选择班级",
              onClick: onShowReport,
            },
            {
              icon: PieChart,
              title: "查看学情分析",
              text: "进入完整学情分析页面。",
              onClick: ctx.openDataAnalysis,
            },
            {
              icon: Users,
              title: "查看学生管理",
              text: "从学生页直接查看画像、分组和关注状态。",
              onClick: ctx.openStudentsDashboard,
            },
          ]}
        />
      </Panel>
      <Panel
        title="报告摘要"
        subtitle="当前班级关键指标"
        className="xl:col-span-7"
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <CompactStat
            label="班级平均分"
            value={
              ctx.averageScore === null ? "--" : ctx.averageScore.toFixed(1)
            }
            icon={Award}
          />
          <CompactStat
            label="知识点平均掌握"
            value={formatPercent(ctx.overallMastery)}
            icon={Brain}
          />
          <CompactStat
            label="作业完成率"
            value={formatPercent(ctx.completionRate)}
            icon={ClipboardCheck}
          />
          <CompactStat
            label="低分率"
            value={formatPercent(ctx.lowScoreRate)}
            icon={TrendingDown}
          />
        </div>
      </Panel>
    </section>
  );
}

function MessageCenter({ ctx }: { ctx: DashboardPageContext }) {
  const messages = [
    {
      icon: TrendingUp,
      title: "成绩趋势已更新",
      text: ctx.averageScore
        ? `${ctx.selectedClass?.name || "当前班级"} 近期平均分 ${ctx.averageScore.toFixed(1)}。`
        : "等待新的成绩分析记录。",
      tag: "趋势",
    },
    {
      icon: AlertCircle,
      title: "薄弱知识点提醒",
      text: ctx.knowledgeAreas[0]
        ? `${ctx.knowledgeAreas[0].name} 错题较集中。`
        : "暂无高频薄弱知识点。",
      tag: "知识点",
    },
    {
      icon: Clock,
      title: "复习安排待确认",
      text: "可以根据本周错题安排一次针对性复习。",
      tag: "复习",
    },
  ];

  return (
    <Panel title="消息列表" subtitle="按重要性聚合近期提醒">
      <div className="space-y-3">
        {messages.map((message) => {
          const Icon = message.icon;
          return (
            <button
              key={message.title}
              className="flex w-full items-start gap-3 rounded-lg bg-slate-50 px-4 py-4 text-left transition hover:bg-blue-50"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-600 text-white">
                <Icon className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-3">
                  <h4 className="font-bold text-slate-900">{message.title}</h4>
                  <span className="rounded-full bg-white px-2 py-1 text-xs font-bold text-slate-500">
                    {message.tag}
                  </span>
                </div>
                <p className="mt-1 text-sm text-slate-500">{message.text}</p>
              </div>
            </button>
          );
        })}
      </div>
    </Panel>
  );
}

function SettingsCenter({ ctx }: { ctx: DashboardPageContext }) {
  return (
    <section className="grid grid-cols-1 gap-6 xl:grid-cols-12">
      <Panel
        title="账号设置"
        subtitle="教师账号与安全信息"
        className="xl:col-span-5"
      >
        <div className="space-y-3">
          <CompactStat
            label="教师姓名"
            value={ctx.teacher.name}
            icon={GraduationCap}
          />
          <CompactStat
            label="手机号"
            value={ctx.teacher.phoneNumber}
            icon={ShieldCheck}
          />
          <CompactStat
            label="班级数量"
            value={`${ctx.classes.length}`}
            icon={BookOpen}
          />
        </div>
      </Panel>
      <Panel
        title="系统偏好"
        subtitle="当前工作台默认配置"
        className="xl:col-span-7"
      >
        <div className="grid gap-3 sm:grid-cols-2">
          {[
            ["默认入口", "首页概览"],
            ["数据范围", "近 30 天"],
            ["图表模式", "趋势优先"],
            ["通知类型", "学情与复习提醒"],
            ["报告格式", "PDF / Excel"],
            ["资料管理", "按知识点归档"],
          ].map(([label, value]) => (
            <div
              key={label}
              className="rounded-lg border border-slate-100 bg-slate-50 px-4 py-3"
            >
              <div className="text-xs font-semibold text-slate-500">
                {label}
              </div>
              <div className="mt-1 text-sm font-bold text-slate-900">
                {value}
              </div>
            </div>
          ))}
        </div>
      </Panel>
    </section>
  );
}

function CompactStat({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string;
  icon: LucideIcon;
}) {
  return (
    <div className="flex items-center gap-3 rounded-lg border border-slate-100 bg-slate-50 px-4 py-4">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white text-blue-600 shadow-sm">
        <Icon className="h-5 w-5" />
      </div>
      <div className="min-w-0">
        <div className="text-xs font-semibold text-slate-500">{label}</div>
        <div className="mt-1 truncate text-lg font-bold text-slate-950">
          {value}
        </div>
      </div>
    </div>
  );
}

function ActionList({
  items,
}: {
  items: Array<{
    icon: LucideIcon;
    title: string;
    text: string;
    onClick: () => void;
  }>;
}) {
  return (
    <div className="space-y-3">
      {items.map((item) => {
        const Icon = item.icon;
        return (
          <button
            key={item.title}
            onClick={item.onClick}
            className="flex w-full items-start gap-3 rounded-lg bg-slate-50 px-4 py-4 text-left transition hover:bg-blue-50"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-600 text-white">
              <Icon className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="font-bold text-slate-900">{item.title}</div>
              <p className="mt-1 text-sm leading-5 text-slate-500">
                {item.text}
              </p>
            </div>
            <ChevronRight className="h-5 w-5 shrink-0 text-slate-300" />
          </button>
        );
      })}
    </div>
  );
}
