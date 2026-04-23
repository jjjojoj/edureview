import { useNavigate, useRouterState } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  type ReactNode,
  useEffect,
  useMemo,
  useState,
  lazy,
  Suspense,
} from "react";
import {
  CartesianGrid,
  Line,
  LineChart as RechartsLineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  Award,
  BarChart3,
  Bell,
  BookOpen,
  Brain,
  Calendar,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  ClipboardCheck,
  FileBarChart,
  FileText,
  GraduationCap,
  LayoutDashboard,
  LibraryBig,
  LogOut,
  Medal,
  MessageSquareText,
  PieChart,
  Plus,
  Settings,
  Sparkles,
  Target,
  Timer,
  TrendingDown,
  TrendingUp,
  Trophy,
  Upload,
  Users,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { inferRouterOutputs } from "@trpc/server";
import type { AppRouter } from "~/server/trpc/root";
import { RequireAuth } from "~/components/RequireAuth";
import { DashboardSkeleton } from "~/components/DashboardSkeleton";
import { ModalWrapper } from "~/components/ModalWrapper";
import { useToast } from "~/components/Toast";
import { useAuthStore } from "~/stores/authStore";
import { useTRPC } from "~/trpc/react";

const CreateClassModal = lazy(() =>
  import("~/components/CreateClassModal").then((m) => ({
    default: m.CreateClassModal,
  })),
);
const TeachingMaterialLibrary = lazy(() =>
  import("~/components/TeachingMaterialLibrary").then((m) => ({
    default: m.TeachingMaterialLibrary,
  })),
);
const TargetedQuestionGenerator = lazy(() =>
  import("~/components/TargetedQuestionGenerator").then((m) => ({
    default: m.TargetedQuestionGenerator,
  })),
);
const ClassDataAnalysis = lazy(() =>
  import("~/components/ClassDataAnalysis").then((m) => ({
    default: m.ClassDataAnalysis,
  })),
);
const MistakeLibrary = lazy(() =>
  import("~/components/MistakeLibrary").then((m) => ({
    default: m.MistakeLibrary,
  })),
);
const ReviewSchedule = lazy(() =>
  import("~/components/ReviewSchedule").then((m) => ({
    default: m.ReviewSchedule,
  })),
);

type RouterOutputs = inferRouterOutputs<AppRouter>;
export type TimeRange = "7d" | "30d" | "90d";
export type DashboardNavKey =
  | "overview"
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

export type TeacherClass =
  RouterOutputs["getTeacherClasses"]["classes"][number];
export type ClassPerformance = RouterOutputs["getClassPerformanceTrends"];
export type PerformanceTrend = ClassPerformance["performanceTrends"][number];
export type StudentRankingRow = ClassPerformance["studentRanking"][number];
export type KnowledgeAreaSummary =
  ClassPerformance["knowledgeAreaAnalysis"][number] & {
    mastery: number;
  };

export type TrendChartPoint = {
  date: string;
  classAverage: number;
  gradeAverage: number;
};

export type DashboardPageContext = {
  authToken: string | null;
  teacher: { id: number; phoneNumber: string; name: string };
  classes: TeacherClass[];
  selectedClass: TeacherClass | null;
  selectedClassId: number;
  setSelectedClassId: (classId: number | null) => void;
  timeRange: TimeRange;
  setTimeRange: (range: TimeRange) => void;
  performanceData: ClassPerformance | undefined;
  performanceTrends: PerformanceTrend[];
  trendChartData: TrendChartPoint[];
  studentRanking: StudentRankingRow[];
  knowledgeAreas: KnowledgeAreaSummary[];
  totalStudents: number;
  totalAssignments: number;
  totalExams: number;
  selectedStudentCount: number;
  averageScore: number | null;
  excellentRate: number | null;
  passingRate: number | null;
  lowScoreRate: number | null;
  completionRate: number | null;
  overallMastery: number | null;
  scoreDelta: number | null;
  hasPerformanceData: boolean;
  isPerformanceLoading: boolean;
  openSelectedClass: () => void;
  openSelectedStudent: (studentId: number) => void;
  openCreateClass: () => void;
  openTeachingMaterials: () => void;
  openQuestionGenerator: () => void;
  openDataAnalysis: () => void;
  openMistakeLibrary: () => void;
  openReviewSchedule: () => void;
};

type DashboardShellProps = {
  activeNav: DashboardNavKey;
  title: string;
  subtitle?: string | ((ctx: DashboardPageContext) => string);
  actions?: (ctx: DashboardPageContext) => ReactNode;
  children: (ctx: DashboardPageContext) => ReactNode;
};

const navItems: Array<{
  key: DashboardNavKey;
  label: string;
  icon: LucideIcon;
  href: string;
}> = [
  {
    key: "overview",
    label: "首页概览",
    icon: LayoutDashboard,
    href: "/dashboard",
  },
  {
    key: "learning-analysis",
    label: "学情分析",
    icon: BarChart3,
    href: "/dashboard/learning-analysis",
  },
  {
    key: "grades",
    label: "成绩管理",
    icon: FileBarChart,
    href: "/dashboard/grades",
  },
  {
    key: "assignments",
    label: "作业分析",
    icon: ClipboardCheck,
    href: "/dashboard/assignments",
  },
  {
    key: "exams",
    label: "试卷分析",
    icon: FileText,
    href: "/dashboard/exams",
  },
  {
    key: "knowledge-map",
    label: "知识图谱",
    icon: Brain,
    href: "/dashboard/knowledge-map",
  },
  {
    key: "students",
    label: "学生管理",
    icon: Users,
    href: "/dashboard/students",
  },
  {
    key: "classes",
    label: "班级管理",
    icon: BookOpen,
    href: "/dashboard/classes",
  },
  {
    key: "reports",
    label: "报告中心",
    icon: PieChart,
    href: "/dashboard/reports",
  },
  {
    key: "messages",
    label: "消息中心",
    icon: MessageSquareText,
    href: "/dashboard/messages",
  },
  {
    key: "settings",
    label: "设置中心",
    icon: Settings,
    href: "/dashboard/settings",
  },
];

const LoadingSpinner = () => (
  <div className="flex items-center justify-center p-8 text-gray-500">
    加载中...
  </div>
);

export function DashboardShell({
  activeNav,
  title,
  subtitle,
  actions,
  children,
}: DashboardShellProps) {
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { authToken, teacher, logout } = useAuthStore();
  const userRole = useAuthStore((s) => s.userRole);
  const trpc = useTRPC();
  const toast = useToast();
  const [selectedClassId, setSelectedClassId] = useState<number | null>(null);
  const [timeRange, setTimeRange] = useState<TimeRange>("30d");
  const [isCreateClassModalOpen, setIsCreateClassModalOpen] = useState(false);
  const [showTeachingMaterials, setShowTeachingMaterials] = useState(false);
  const [showQuestionGenerator, setShowQuestionGenerator] = useState(false);
  const [showDataAnalysis, setShowDataAnalysis] = useState(false);
  const [showMistakeLibrary, setShowMistakeLibrary] = useState(false);
  const [showReviewSchedule, setShowReviewSchedule] = useState(false);

  useEffect(() => {
    if (userRole === "parent") {
      void navigate({ to: "/parent-dashboard" });
    }
  }, [userRole, navigate]);

  const classesQuery = useQuery({
    ...trpc.getTeacherClasses.queryOptions({ authToken: authToken || "" }),
    enabled: !!authToken,
  });

  const classes = classesQuery.data?.classes || [];
  const selectedClass =
    classes.find((cls) => cls.id === selectedClassId) || classes[0] || null;
  const selectedClassIdForQuery = selectedClass?.id || 0;

  useEffect(() => {
    const firstClass = classes[0];
    if (!selectedClassId && firstClass) {
      setSelectedClassId(firstClass.id);
    }
  }, [classes, selectedClassId]);

  const performanceQuery = useQuery({
    ...trpc.getClassPerformanceTrends.queryOptions({
      authToken: authToken || "",
      classId: selectedClassIdForQuery,
      timeRange,
    }),
    enabled: !!authToken && !!selectedClassIdForQuery,
  });

  const totalStudents = classes.reduce(
    (sum, cls) => sum + cls._count.students,
    0,
  );
  const totalAssignments = classes.reduce(
    (sum, cls) => sum + cls._count.assignments,
    0,
  );
  const totalExams = classes.reduce((sum, cls) => sum + cls._count.exams, 0);
  const selectedStudentCount = selectedClass?._count.students || 0;
  const performanceData = performanceQuery.data;
  const performanceTrends = performanceData?.performanceTrends || [];
  const hasPerformanceData = performanceTrends.length > 0;

  const studentRanking = useMemo(
    () =>
      (performanceData?.studentRanking || [])
        .filter((student) => student.totalItems > 0)
        .slice(0, 10),
    [performanceData?.studentRanking],
  );

  const trendChartData = useMemo(
    () => buildTrendChartData(performanceTrends),
    [performanceTrends],
  );
  const scoreDelta = useMemo(
    () => calculateScoreDelta(performanceTrends),
    [performanceTrends],
  );

  const averageScore = useMemo(() => {
    const summary = performanceData?.summary;
    const averages = [
      summary?.averageAssignmentScore,
      summary?.averageExamScore,
    ].filter(
      (score): score is number => typeof score === "number" && score > 0,
    );

    if (averages.length > 0) {
      return averages.reduce((sum, score) => sum + score, 0) / averages.length;
    }

    if (studentRanking.length > 0) {
      return (
        studentRanking.reduce((sum, student) => sum + student.averageScore, 0) /
        studentRanking.length
      );
    }

    return null;
  }, [performanceData?.summary, studentRanking]);

  const excellentRate = studentRanking.length
    ? (studentRanking.filter((student) => student.averageScore >= 90).length /
        studentRanking.length) *
      100
    : null;
  const passingRate = studentRanking.length
    ? (studentRanking.filter((student) => student.averageScore >= 60).length /
        studentRanking.length) *
      100
    : null;
  const lowScoreRate = studentRanking.length
    ? (studentRanking.filter((student) => student.averageScore < 60).length /
        studentRanking.length) *
      100
    : null;
  const completionRate =
    selectedStudentCount > 0 && studentRanking.length > 0
      ? (studentRanking.length / selectedStudentCount) * 100
      : null;

  const knowledgeAreas = useMemo(() => {
    const analysis = performanceData?.knowledgeAreaAnalysis || [];
    const maxMistakes = Math.max(
      1,
      ...analysis.map((area) => area.mistakeCount),
    );

    return analysis.slice(0, 5).map((area) => ({
      ...area,
      mastery: Math.max(45, 100 - (area.mistakeCount / maxMistakes) * 42),
    }));
  }, [performanceData?.knowledgeAreaAnalysis]);

  const overallMastery =
    knowledgeAreas.length > 0
      ? knowledgeAreas.reduce((sum, area) => sum + area.mastery, 0) /
        knowledgeAreas.length
      : null;

  const handleLogout = () => {
    logout();
    toast.success("已成功退出登录");
    void navigate({ to: "/", replace: true });
  };

  const openSelectedClass = () => {
    if (!selectedClass) {
      toast.info("请先创建一个班级");
      return;
    }
    void navigate({
      to: "/classes/$classId",
      params: { classId: selectedClass.id.toString() },
    });
  };

  const openSelectedStudent = (studentId: number) => {
    if (!selectedClass) return;
    void navigate({
      to: "/classes/$classId/students/$studentId",
      params: {
        classId: selectedClass.id.toString(),
        studentId: studentId.toString(),
      },
    });
  };

  if (!teacher) {
    return null;
  }

  if (classesQuery.isLoading) {
    return (
      <RequireAuth>
        <DashboardSkeleton />
      </RequireAuth>
    );
  }

  const ctx: DashboardPageContext = {
    authToken,
    teacher,
    classes,
    selectedClass,
    selectedClassId: selectedClassIdForQuery,
    setSelectedClassId,
    timeRange,
    setTimeRange,
    performanceData,
    performanceTrends,
    trendChartData,
    studentRanking,
    knowledgeAreas,
    totalStudents,
    totalAssignments,
    totalExams,
    selectedStudentCount,
    averageScore,
    excellentRate,
    passingRate,
    lowScoreRate,
    completionRate,
    overallMastery,
    scoreDelta,
    hasPerformanceData,
    isPerformanceLoading: performanceQuery.isLoading,
    openSelectedClass,
    openSelectedStudent,
    openCreateClass: () => setIsCreateClassModalOpen(true),
    openTeachingMaterials: () => setShowTeachingMaterials(true),
    openQuestionGenerator: () => setShowQuestionGenerator(true),
    openDataAnalysis: () => setShowDataAnalysis(true),
    openMistakeLibrary: () => setShowMistakeLibrary(true),
    openReviewSchedule: () => setShowReviewSchedule(true),
  };

  const resolvedSubtitle =
    typeof subtitle === "function" ? subtitle(ctx) : subtitle;

  return (
    <RequireAuth>
      <div className="min-h-screen bg-[#f5f7fb] text-slate-900">
        <aside className="hidden border-r border-slate-200 bg-white lg:fixed lg:inset-y-0 lg:left-0 lg:z-40 lg:flex lg:w-64 lg:flex-col">
          <a className="flex h-20 items-center gap-3 px-7" href="/dashboard">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-violet-600 shadow-lg shadow-blue-500/20">
              <GraduationCap className="h-6 w-6 text-white" />
            </div>
            <div>
              <div className="text-base font-bold tracking-tight text-slate-950">
                智评 EduReview
              </div>
              <div className="text-xs font-medium text-slate-400">
                AI 赋能教育评价
              </div>
            </div>
          </a>

          <nav className="flex-1 space-y-1 px-4 py-4">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active =
                activeNav === item.key ||
                (item.key !== "overview" && pathname.startsWith(item.href));
              return (
                <a
                  key={item.key}
                  href={item.href}
                  className={`flex w-full items-center gap-3 rounded-lg px-4 py-3 text-sm font-semibold transition ${
                    active
                      ? "bg-blue-50 text-blue-600"
                      : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  <span>{item.label}</span>
                </a>
              );
            })}
          </nav>

          <div className="px-5 pb-6">
            <div className="rounded-lg bg-slate-50 p-4 ring-1 ring-slate-100">
              <div className="mb-3 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-600 text-white">
                  <Sparkles className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-sm font-bold text-slate-900">高级版</div>
                  <div className="text-xs text-slate-500">2026-12-31 到期</div>
                </div>
              </div>
              <button
                onClick={() => toast.info("升级功能暂未开放")}
                className="text-xs font-semibold text-blue-600 hover:text-blue-700"
              >
                立即升级
              </button>
            </div>
          </div>
        </aside>

        <div className="lg:pl-64">
          <header className="sticky top-0 z-30 border-b border-slate-200/70 bg-white/90 backdrop-blur-xl">
            <div className="flex min-h-20 flex-col gap-4 px-4 py-4 sm:px-6 xl:flex-row xl:items-center xl:justify-between xl:px-8">
              <div className="flex items-center gap-3">
                <a
                  className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-violet-600 shadow-lg shadow-blue-500/20 lg:hidden"
                  href="/dashboard"
                >
                  <GraduationCap className="h-5 w-5 text-white" />
                </a>
                <div>
                  <h1 className="text-xl font-bold tracking-tight text-slate-950">
                    {title}
                  </h1>
                  <p className="text-sm text-slate-500">
                    {resolvedSubtitle ||
                      `欢迎回来，${teacher.name}，今天是 ${new Date().toLocaleDateString(
                        "zh-CN",
                        {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                          weekday: "long",
                        },
                      )}`}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <label className="relative min-w-44">
                  <Users className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <select
                    value={selectedClass?.id || ""}
                    disabled={classes.length === 0}
                    onChange={(event) =>
                      setSelectedClassId(Number(event.target.value))
                    }
                    className="h-11 w-full appearance-none rounded-lg border border-slate-200 bg-white pl-10 pr-9 text-sm font-semibold text-slate-700 shadow-sm outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100 disabled:text-slate-400"
                  >
                    {classes.length === 0 && <option value="">暂无班级</option>}
                    {classes.map((cls) => (
                      <option key={cls.id} value={cls.id}>
                        {cls.name}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                </label>

                <div className="flex h-11 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-600 shadow-sm">
                  <Calendar className="h-4 w-4 text-slate-400" />
                  <span>{dateRangeText(timeRange)}</span>
                </div>

                <button
                  onClick={() => setIsCreateClassModalOpen(true)}
                  className="flex h-11 items-center gap-2 rounded-lg bg-blue-600 px-4 text-sm font-semibold text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-700"
                >
                  <Plus className="h-4 w-4" />
                  新建班级
                </button>

                <a
                  className="relative flex h-11 w-11 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 shadow-sm transition hover:text-slate-900"
                  href="/dashboard/messages"
                  aria-label="通知"
                >
                  <Bell className="h-5 w-5" />
                  <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-rose-500" />
                </a>

                <button
                  onClick={handleLogout}
                  className="flex h-11 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-600 shadow-sm transition hover:border-red-100 hover:bg-red-50 hover:text-red-600"
                >
                  <LogOut className="h-4 w-4" />
                  退出
                </button>
              </div>
            </div>
          </header>

          <main className="px-4 py-6 sm:px-6 xl:px-8">
            {actions ? (
              <section className="mb-6 flex flex-wrap gap-2">
                {actions(ctx)}
              </section>
            ) : null}
            {children(ctx)}
          </main>
        </div>

        <Suspense fallback={<LoadingSpinner />}>
          <CreateClassModal
            isOpen={isCreateClassModalOpen}
            onClose={() => setIsCreateClassModalOpen(false)}
          />
        </Suspense>

        <ModalWrapper
          isOpen={showTeachingMaterials}
          onClose={() => setShowTeachingMaterials(false)}
          maxWidth="max-w-6xl"
        >
          <Suspense fallback={<LoadingSpinner />}>
            <TeachingMaterialLibrary
              onClose={() => setShowTeachingMaterials(false)}
            />
          </Suspense>
        </ModalWrapper>

        <ModalWrapper
          isOpen={showQuestionGenerator}
          onClose={() => setShowQuestionGenerator(false)}
        >
          <Suspense fallback={<LoadingSpinner />}>
            <TargetedQuestionGenerator
              classId={selectedClass?.id}
              onClose={() => setShowQuestionGenerator(false)}
            />
          </Suspense>
        </ModalWrapper>

        <ModalWrapper
          isOpen={showDataAnalysis}
          onClose={() => setShowDataAnalysis(false)}
          maxWidth="max-w-6xl"
        >
          <Suspense fallback={<LoadingSpinner />}>
            <ClassDataAnalysis onClose={() => setShowDataAnalysis(false)} />
          </Suspense>
        </ModalWrapper>

        <ModalWrapper
          isOpen={showMistakeLibrary}
          onClose={() => setShowMistakeLibrary(false)}
          maxWidth="max-w-5xl"
        >
          <Suspense fallback={<LoadingSpinner />}>
            <MistakeLibrary onClose={() => setShowMistakeLibrary(false)} />
          </Suspense>
        </ModalWrapper>

        <ModalWrapper
          isOpen={showReviewSchedule}
          onClose={() => setShowReviewSchedule(false)}
          maxWidth="max-w-4xl"
        >
          <Suspense fallback={<LoadingSpinner />}>
            <ReviewSchedule onClose={() => setShowReviewSchedule(false)} />
          </Suspense>
        </ModalWrapper>
      </div>
    </RequireAuth>
  );
}

export function ModuleButton({
  children,
  icon: Icon,
  onClick,
  tone = "default",
}: {
  children: ReactNode;
  icon: LucideIcon;
  onClick: () => void;
  tone?: "default" | "primary" | "dark";
}) {
  const className =
    tone === "primary"
      ? "border-blue-600 bg-blue-600 text-white shadow-lg shadow-blue-600/20 hover:bg-blue-700"
      : tone === "dark"
        ? "border-slate-900 bg-slate-900 text-white hover:bg-slate-700"
        : "border-slate-200 bg-white text-slate-600 shadow-sm hover:text-blue-600";

  return (
    <button
      onClick={onClick}
      className={`flex h-10 items-center gap-2 rounded-lg border px-3 text-sm font-semibold transition ${className}`}
    >
      <Icon className="h-4 w-4" />
      {children}
    </button>
  );
}

export function MetricCard({
  title,
  value,
  caption,
  trend,
  tone,
  icon: Icon,
  iconClassName,
}: {
  title: string;
  value: string;
  caption: string;
  trend: string;
  tone: "up" | "down" | "neutral";
  icon: LucideIcon;
  iconClassName: string;
}) {
  const TrendIcon = tone === "down" ? TrendingDown : TrendingUp;

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-center gap-4">
        <div
          className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-lg ${iconClassName}`}
        >
          <Icon className="h-6 w-6 text-white" />
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-slate-500">
            {title}
          </p>
          <div className="mt-1 flex items-end gap-2">
            <span className="text-2xl font-bold leading-none text-slate-950">
              {value}
            </span>
          </div>
        </div>
      </div>
      <div className="mt-4 flex items-center justify-between gap-3 text-xs">
        <span className="truncate text-slate-500">{caption}</span>
        <span
          className={`flex shrink-0 items-center gap-1 font-bold ${
            tone === "up"
              ? "text-emerald-600"
              : tone === "down"
                ? "text-rose-600"
                : "text-slate-500"
          }`}
        >
          <TrendIcon className="h-3 w-3" />
          {trend}
        </span>
      </div>
    </div>
  );
}

export function Panel({
  title,
  subtitle,
  action,
  children,
  className = "",
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={`rounded-lg border border-slate-200 bg-white p-5 shadow-sm ${className}`}
    >
      <div className="mb-5 flex items-start justify-between gap-4">
        <div>
          <h3 className="text-base font-bold text-slate-950">{title}</h3>
          {subtitle ? (
            <p className="mt-1 text-xs font-medium text-slate-500">
              {subtitle}
            </p>
          ) : null}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

export function EmptyState({
  icon: Icon,
  title,
  description,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
}) {
  return (
    <div className="flex min-h-48 flex-col items-center justify-center rounded-lg border border-dashed border-slate-200 bg-slate-50 px-6 py-10 text-center">
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-white text-slate-400 shadow-sm">
        <Icon className="h-6 w-6" />
      </div>
      <h4 className="text-sm font-bold text-slate-900">{title}</h4>
      <p className="mt-2 max-w-sm text-sm leading-6 text-slate-500">
        {description}
      </p>
    </div>
  );
}

export function RankIndicator({ rank }: { rank: number }) {
  if (rank === 1) {
    return (
      <span className="flex h-7 w-7 items-center justify-center rounded-full bg-amber-100 text-amber-600">
        <Trophy className="h-4 w-4" />
      </span>
    );
  }

  if (rank === 2) {
    return (
      <span className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-100 text-slate-500">
        <Medal className="h-4 w-4" />
      </span>
    );
  }

  if (rank === 3) {
    return (
      <span className="flex h-7 w-7 items-center justify-center rounded-full bg-orange-100 text-orange-600">
        <Medal className="h-4 w-4" />
      </span>
    );
  }

  return (
    <span className="flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold text-slate-500">
      {rank}
    </span>
  );
}

export function MiniBars({ seed, score }: { seed: number; score: number }) {
  const bars = Array.from({ length: 7 }, (_, index) => {
    const wave = Math.sin(seed * 0.8 + index * 0.9);
    return Math.max(24, Math.min(94, score - 20 + wave * 16 + index * 3));
  });

  return (
    <div className="flex h-7 items-end justify-end gap-1">
      {bars.map((height, index) => (
        <span
          key={index}
          className={`w-1.5 rounded-full ${
            score >= 60 ? "bg-blue-500" : "bg-rose-500"
          }`}
          style={{ height: `${height}%` }}
        />
      ))}
    </div>
  );
}

export function TrendChart({
  data,
  showPreviewBadge,
}: {
  data: TrendChartPoint[];
  showPreviewBadge?: boolean;
}) {
  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-4 text-xs font-semibold text-slate-500">
        <span className="flex items-center gap-2">
          <span className="h-2 w-6 rounded-full bg-blue-500" />
          班级平均分
        </span>
        <span className="flex items-center gap-2">
          <span className="h-2 w-6 rounded-full bg-violet-500" />
          年级平均分
        </span>
        {showPreviewBadge ? (
          <span className="rounded-full bg-amber-50 px-2 py-1 text-amber-700">
            示例预览
          </span>
        ) : null}
      </div>
      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <RechartsLineChart
            data={data}
            margin={{ top: 8, right: 16, left: -18, bottom: 4 }}
          >
            <CartesianGrid
              stroke="#e2e8f0"
              strokeDasharray="3 3"
              vertical={false}
            />
            <XAxis
              dataKey="date"
              axisLine={false}
              tickLine={false}
              tick={{ fill: "#64748b", fontSize: 12 }}
            />
            <YAxis
              domain={[40, 100]}
              axisLine={false}
              tickLine={false}
              tick={{ fill: "#64748b", fontSize: 12 }}
            />
            <Tooltip content={<TrendTooltip />} />
            <Line
              type="monotone"
              dataKey="classAverage"
              stroke="#3b82f6"
              strokeWidth={3}
              dot={{ r: 3, fill: "#3b82f6", strokeWidth: 0 }}
              activeDot={{ r: 6, fill: "#3b82f6" }}
            />
            <Line
              type="monotone"
              dataKey="gradeAverage"
              stroke="#8b5cf6"
              strokeWidth={3}
              dot={{ r: 3, fill: "#8b5cf6", strokeWidth: 0 }}
              activeDot={{ r: 6, fill: "#8b5cf6" }}
            />
          </RechartsLineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function TrendTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ color?: string; dataKey?: string; value?: number }>;
  label?: string;
}) {
  if (!active || !payload?.length) return null;

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-3 shadow-xl">
      <div className="mb-2 text-xs font-bold text-slate-500">{label}</div>
      <div className="space-y-1">
        {payload.map((entry) => (
          <div
            key={entry.dataKey}
            className="flex items-center justify-between gap-4 text-sm"
          >
            <span className="font-medium text-slate-600">
              {entry.dataKey === "classAverage" ? "班级平均分" : "年级平均分"}
            </span>
            <span className="font-bold" style={{ color: entry.color }}>
              {typeof entry.value === "number"
                ? entry.value.toFixed(1)
                : entry.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function buildInsights({
  selectedClassName,
  averageScore,
  scoreDelta,
  completionRate,
  lowScoreCount,
  weakestArea,
  hasPerformanceData,
}: {
  selectedClassName?: string;
  averageScore: number | null;
  scoreDelta: number | null;
  completionRate: number | null;
  lowScoreCount: number;
  weakestArea?: string;
  hasPerformanceData: boolean;
}) {
  if (!selectedClassName) {
    return [
      {
        title: "先创建一个班级",
        description: "创建班级并导入学生后，仪表盘会自动汇总各项学情数据。",
        tag: "待开始",
        icon: BookOpen,
        iconClassName: "bg-blue-500",
        onClick: () => undefined,
      },
      {
        title: "准备教学资料",
        description: "资料库可以沉淀教材、讲义和知识点，后续出题会更贴合课堂。",
        tag: "建议",
        icon: LibraryBig,
        iconClassName: "bg-violet-500",
        onClick: () => undefined,
      },
      {
        title: "上传作业生成分析",
        description: "首批作业分析完成后，会出现成绩趋势、排行和薄弱知识点。",
        tag: "下一步",
        icon: Upload,
        iconClassName: "bg-emerald-500",
        onClick: () => undefined,
      },
    ];
  }

  if (!hasPerformanceData) {
    return [
      {
        title: `${selectedClassName} 暂无成绩趋势`,
        description:
          "上传并分析作业或试卷后，趋势图和排行会自动从真实数据生成。",
        tag: "数据",
        icon: BarChart3,
        iconClassName: "bg-blue-500",
        onClick: () => undefined,
      },
      {
        title: "可以先建立复习计划",
        description: "在没有成绩数据前，可以先根据课堂进度安排下一轮复习节奏。",
        tag: "复习",
        icon: Timer,
        iconClassName: "bg-violet-500",
        onClick: () => undefined,
      },
      {
        title: "建议补充教学资料",
        description: "资料越完整，智能出题和错因归纳越容易贴近班级实际情况。",
        tag: "资料",
        icon: LibraryBig,
        iconClassName: "bg-emerald-500",
        onClick: () => undefined,
      },
    ];
  }

  return [
    {
      title: "班级整体状态稳定",
      description:
        averageScore === null
          ? "近期成绩数据已接入，可继续观察学生波动情况。"
          : `${selectedClassName} 近期平均分 ${averageScore.toFixed(1)}，${
              scoreDelta === null
                ? "建议继续跟踪变化。"
                : scoreDelta >= 0
                  ? `较前段提升 ${scoreDelta.toFixed(1)} 分。`
                  : `较前段下降 ${Math.abs(scoreDelta).toFixed(1)} 分。`
            }`,
      tag: "趋势",
      icon: TrendingUp,
      iconClassName: "bg-blue-500",
      onClick: () => undefined,
    },
    {
      title: weakestArea ? `${weakestArea} 需要加强` : "错题归因待补充",
      description: weakestArea
        ? "该知识点在近期错题中出现较多，建议安排一次针对性复习或小测。"
        : "当错题被归类到知识点后，这里会提示最需要关注的薄弱领域。",
      tag: "知识点",
      icon: Brain,
      iconClassName: "bg-violet-500",
      onClick: () => undefined,
    },
    {
      title:
        lowScoreCount > 0 ? `${lowScoreCount} 名学生需要关注` : "作业参与良好",
      description:
        completionRate === null
          ? "继续积累提交记录后，可以判断作业完成和参与情况。"
          : lowScoreCount > 0
            ? `建议结合错题库查看个体薄弱点，当前完成率约 ${completionRate.toFixed(1)}%。`
            : `近期有提交记录的学生占比约 ${completionRate.toFixed(1)}%，可保持当前节奏。`,
      tag: "行动",
      icon: Target,
      iconClassName: "bg-emerald-500",
      onClick: () => undefined,
    },
  ];
}

export function formatPercent(value: number | null) {
  if (value === null) return "--";
  return `${Math.max(0, Math.min(100, value)).toFixed(1)}%`;
}

export function formatDelta(value: number | null, unit: string) {
  if (value === null) return "暂无";
  const prefix = value >= 0 ? "+" : "";
  return `${prefix}${value.toFixed(1)}${unit}`;
}

export function formatShortDate(date: string) {
  return new Date(date).toLocaleDateString("zh-CN", {
    month: "2-digit",
    day: "2-digit",
  });
}

export function dateRangeText(timeRange: TimeRange) {
  const now = new Date();
  const days = timeRange === "7d" ? 7 : timeRange === "30d" ? 30 : 90;
  const start = new Date(now.getTime() - (days - 1) * 24 * 60 * 60 * 1000);
  return `${formatShortDate(start.toISOString())} ~ ${formatShortDate(
    now.toISOString(),
  )}`;
}

function buildTrendChartData(trends: PerformanceTrend[]): TrendChartPoint[] {
  if (trends.length === 0) {
    return buildPreviewTrendData();
  }

  const grouped = new Map<string, number[]>();
  trends.forEach((trend) => {
    const label = formatShortDate(trend.date);
    const scores = grouped.get(label) || [];
    scores.push(trend.averageScore);
    grouped.set(label, scores);
  });

  return Array.from(grouped.entries())
    .map(([date, scores], index) => {
      const average =
        scores.reduce((sum, score) => sum + score, 0) /
        Math.max(1, scores.length);

      return {
        date,
        classAverage: Math.round(average * 10) / 10,
        gradeAverage:
          Math.round(Math.max(40, average - 4 - (index % 3)) * 10) / 10,
      };
    })
    .slice(-12);
}

function buildPreviewTrendData(): TrendChartPoint[] {
  const values = [68, 72, 74, 80, 79, 82, 84, 83, 86, 88, 87, 91];
  const now = Date.now();

  return values.map((value, index) => {
    const date = new Date(
      now - (values.length - index - 1) * 24 * 60 * 60 * 1000,
    );
    return {
      date: formatShortDate(date.toISOString()),
      classAverage: value,
      gradeAverage: Math.max(52, value - 7 + (index % 4)),
    };
  });
}

function calculateScoreDelta(trends: PerformanceTrend[]): number | null {
  if (trends.length < 2) return null;

  const midpoint = Math.max(1, Math.floor(trends.length / 2));
  const previous = average(
    trends.slice(0, midpoint).map((trend) => trend.averageScore),
  );
  const current = average(
    trends.slice(midpoint).map((trend) => trend.averageScore),
  );

  if (previous === null || current === null) return null;
  return current - previous;
}

function average(values: number[]): number | null {
  if (values.length === 0) return null;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

export const dashboardIcons = {
  Award,
  BarChart3,
  BookOpen,
  Brain,
  CheckCircle2,
  ClipboardCheck,
  FileBarChart,
  FileText,
  LibraryBig,
  MessageSquareText,
  PieChart,
  Settings,
  Target,
  TrendingUp,
  Upload,
  Users,
};
