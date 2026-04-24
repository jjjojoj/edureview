import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTRPC } from "~/trpc/react";
import { useAuthStore } from "~/stores/authStore";
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Users,
  AlertTriangle,
  Loader2,
  Trophy,
  BookOpen,
  FileText,
  Brain,
  Medal,
  ChevronUp,
  ChevronDown,
  Award,
} from "lucide-react";

interface ClassDataAnalysisProps {
  onClose?: () => void;
  showHeader?: boolean;
  variant?: "modal" | "page";
  initialClassId?: number | null;
}

type SortField = "rank" | "name" | "avg" | "assignment" | "exam";
type TimeRange = "7d" | "30d" | "90d" | "1y" | "all";

const TIME_RANGE_OPTIONS: Array<{ value: TimeRange; label: string }> = [
  { value: "7d", label: "7天" },
  { value: "30d", label: "30天" },
  { value: "90d", label: "90天" },
  { value: "all", label: "全部" },
];

export function ClassDataAnalysis({
  onClose,
  showHeader = true,
  variant = "modal",
  initialClassId = null,
}: ClassDataAnalysisProps) {
  const { authToken } = useAuthStore();
  const trpc = useTRPC();
  const [selectedClassId, setSelectedClassId] = useState<number | null>(
    initialClassId,
  );
  const [timeRange, setTimeRange] = useState<TimeRange>("all");
  const [sortField, setSortField] = useState<SortField>("rank");
  const [sortAsc, setSortAsc] = useState(true);

  useEffect(() => {
    setSelectedClassId(initialClassId);
  }, [initialClassId]);

  const classesQuery = useQuery({
    ...trpc.getTeacherClasses.queryOptions({ authToken: authToken || "" }),
    enabled: !!authToken,
  });

  const trendsQuery = useQuery({
    ...trpc.getClassPerformanceTrends.queryOptions({
      classId: selectedClassId!,
      timeRange,
      authToken: authToken || "",
    }),
    enabled: !!selectedClassId && !!authToken,
  });

  const classes = classesQuery.data?.classes || [];
  const trends = trendsQuery.data;

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return `${d.getMonth() + 1}/${d.getDate()}`;
  };

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(field === "name");
    }
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field)
      return <ChevronUp className="h-3 w-3 text-gray-300" />;
    return sortAsc ? (
      <ChevronUp className="h-3 w-3 text-blue-600" />
    ) : (
      <ChevronDown className="h-3 w-3 text-blue-600" />
    );
  };

  // Sorted student ranking
  const ranking = trends?.studentRanking
    ? [...trends.studentRanking].sort((a, b) => {
        switch (sortField) {
          case "rank":
            return sortAsc
              ? a.averageScore - b.averageScore
              : b.averageScore - a.averageScore;
          case "name":
            return sortAsc
              ? a.studentName.localeCompare(b.studentName)
              : b.studentName.localeCompare(a.studentName);
          case "avg":
            return sortAsc
              ? a.averageScore - b.averageScore
              : b.averageScore - a.averageScore;
          case "assignment":
            return sortAsc
              ? a.assignmentAvg - b.assignmentAvg
              : b.assignmentAvg - a.assignmentAvg;
          case "exam":
            return sortAsc ? a.examAvg - b.examAvg : b.examAvg - a.examAvg;
          default:
            return 0;
        }
      })
    : [];

  const getRankBadge = (index: number) => {
    if (index === 0) return <Trophy className="h-4 w-4 text-yellow-500" />;
    if (index === 1) return <Medal className="h-4 w-4 text-gray-400" />;
    if (index === 2) return <Medal className="h-4 w-4 text-amber-600" />;
    return (
      <span className="w-4 text-center text-xs text-gray-400">{index + 1}</span>
    );
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return "text-green-600";
    if (score >= 80) return "text-blue-600";
    if (score >= 70) return "text-yellow-600";
    if (score >= 60) return "text-orange-600";
    return "text-red-600";
  };

  // Build separate chart for assignments and exams
  const buildChartData = (data: { date: string; averageScore: number }[]) => {
    if (!data || data.length === 0) return null;
    const scores = data.map((d) => d.averageScore);
    const min = Math.max(0, Math.min(...scores) - 10);
    const max = Math.min(100, Math.max(...scores) + 10);
    const range = max - min || 1;
    return { data, min, max, range };
  };

  const assignmentChart = buildChartData(trends?.assignmentTrends || []);
  const examChart = buildChartData(trends?.examTrends || []);

  const renderLineChart = (
    chart: ReturnType<typeof buildChartData>,
    color1: string,
    color2: string,
    label: string,
  ) => {
    if (!chart || chart.data.length === 0) {
      return (
        <div className="py-8 text-center text-sm text-gray-400">
          暂无{label}数据
        </div>
      );
    }
    const { data, min, max, range } = chart;
    return (
      <div className="relative">
        <div className="absolute bottom-8 left-0 top-0 flex w-8 flex-col justify-between text-xs text-gray-400">
          <span>{max}</span>
          <span>{Math.round((max + min) / 2)}</span>
          <span>{min}</span>
        </div>
        <div className="relative ml-10 h-40">
          <div className="absolute inset-0 flex flex-col justify-between">
            <div className="border-t border-gray-100" />
            <div className="border-t border-gray-100" />
            <div className="border-t border-gray-100" />
          </div>
          <svg
            className="absolute inset-0 h-full w-full"
            preserveAspectRatio="none"
          >
            {data.length >= 2 &&
              (() => {
                const w = 100 / (data.length - 1);
                const pathD = data
                  .map((p, i) => {
                    const x = i * w;
                    const y = 100 - ((p.averageScore - min) / range) * 100;
                    return `${i === 0 ? "M" : "L"}${x},${y}`;
                  })
                  .join(" ");
                // Area fill
                const areaD = pathD + ` L${100},100 L0,100 Z`;
                return (
                  <>
                    <path
                      d={areaD}
                      fill={`url(#area-${label})`}
                      opacity={0.15}
                    />
                    <path
                      d={pathD}
                      fill="none"
                      stroke={`url(#line-${label})`}
                      strokeWidth="2.5"
                      vectorEffect="non-scaling-stroke"
                    />
                    <defs>
                      <linearGradient
                        id={`line-${label}`}
                        x1="0%"
                        y1="0%"
                        x2="100%"
                        y2="0%"
                      >
                        <stop offset="0%" stopColor={color1} />
                        <stop offset="100%" stopColor={color2} />
                      </linearGradient>
                      <linearGradient
                        id={`area-${label}`}
                        x1="0%"
                        y1="0%"
                        x2="0%"
                        y2="100%"
                      >
                        <stop
                          offset="0%"
                          stopColor={color1}
                          stopOpacity={0.3}
                        />
                        <stop
                          offset="100%"
                          stopColor={color1}
                          stopOpacity={0}
                        />
                      </linearGradient>
                    </defs>
                  </>
                );
              })()}
          </svg>
          <div className="absolute inset-0 flex items-end">
            {data.map((p, i) => {
              const height = ((p.averageScore - min) / range) * 100;
              return (
                <div
                  key={i}
                  className="group relative flex h-full flex-1 flex-col items-center justify-end"
                >
                  <div className="absolute -top-8 z-10 whitespace-nowrap rounded bg-gray-800 px-2 py-1 text-xs text-white opacity-0 transition-opacity group-hover:opacity-100">
                    {p.averageScore.toFixed(1)}分
                  </div>
                  <div
                    className="h-3 w-3 rounded-full border-2 border-white shadow-sm"
                    style={{ background: color1 }}
                  />
                </div>
              );
            })}
          </div>
        </div>
        <div className="ml-10 mt-2 flex">
          {data.map((p, i) => (
            <div
              key={i}
              className="flex-1 truncate text-center text-xs text-gray-400"
            >
              {formatDate(p.date)}
            </div>
          ))}
        </div>
      </div>
    );
  };

  // Knowledge area data
  const knowledgeAreas = trends?.knowledgeAreaAnalysis || [];
  const maxKaMistakes =
    knowledgeAreas.length > 0
      ? Math.max(...knowledgeAreas.map((k) => k.mistakeCount))
      : 0;

  return (
    <div
      className={
        variant === "page" ? "space-y-6" : "max-h-[85vh] overflow-y-auto p-6"
      }
    >
      {showHeader ? (
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center">
            <div className="mr-3 flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-green-500 to-emerald-600">
              <BarChart3 className="h-6 w-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">数据分析</h2>
              <p className="text-sm text-gray-500">查看班级表现趋势与统计</p>
            </div>
          </div>
          {onClose ? (
            <button
              onClick={onClose}
              className="text-2xl leading-none text-gray-400 hover:text-gray-600"
            >
              &times;
            </button>
          ) : null}
        </div>
      ) : null}

      {/* Class Selector + Time Range */}
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            选择班级
          </label>
          <select
            value={selectedClassId || ""}
            onChange={(e) =>
              setSelectedClassId(e.target.value ? Number(e.target.value) : null)
            }
            className="w-full rounded-xl border border-gray-300 bg-white px-4 py-2.5 focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
          >
            <option value="">请选择班级</option>
            {classes.map((cls) => (
              <option key={cls.id} value={cls.id}>
                {cls.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            时间范围
          </label>
          <div className="flex gap-2">
            {TIME_RANGE_OPTIONS.map((range) => (
              <button
                key={range.value}
                onClick={() => setTimeRange(range.value)}
                className={`rounded-lg px-3 py-2 text-sm font-medium transition-all ${
                  timeRange === range.value
                    ? "shadow-glow bg-blue-600 text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {range.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {!selectedClassId ? (
        <div className="py-16 text-center">
          <BarChart3 className="mx-auto mb-4 h-16 w-16 text-gray-300" />
          <p className="text-gray-500">请选择一个班级开始查看数据分析</p>
        </div>
      ) : trendsQuery.isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="mr-3 h-8 w-8 animate-spin text-blue-500" />
          <span className="text-gray-500">加载中...</span>
        </div>
      ) : trends ? (
        <div className="space-y-6">
          {/* ── Summary Stats ── */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50 p-3">
              <p className="mb-1 text-xs text-gray-500">学生人数</p>
              <p className="text-2xl font-bold text-blue-700">
                {trends.summary.totalStudents}
              </p>
            </div>
            <div className="rounded-xl bg-gradient-to-br from-green-50 to-emerald-50 p-3">
              <p className="mb-1 text-xs text-gray-500">作业均分</p>
              <p className="text-2xl font-bold text-green-700">
                {trends.summary.averageAssignmentScore.toFixed(1)}
              </p>
            </div>
            <div className="rounded-xl bg-gradient-to-br from-purple-50 to-pink-50 p-3">
              <p className="mb-1 text-xs text-gray-500">考试均分</p>
              <p className="text-2xl font-bold text-purple-700">
                {trends.summary.averageExamScore.toFixed(1)}
              </p>
            </div>
            <div className="rounded-xl bg-gradient-to-br from-orange-50 to-red-50 p-3">
              <p className="mb-1 text-xs text-gray-500">错题总数</p>
              <p className="text-2xl font-bold text-orange-700">
                {trends.summary.totalMistakes}
              </p>
            </div>
          </div>

          {/* ── Student Ranking Table ── */}
          {ranking.length > 0 && (
            <div className="card p-5">
              <h3 className="mb-4 flex items-center font-bold text-gray-900">
                <Award className="mr-2 h-5 w-5 text-yellow-500" />
                学生排名
                <span className="ml-2 text-xs font-normal text-gray-400">
                  点击表头排序
                </span>
              </h3>
              <div className="-mx-5 overflow-x-auto px-5">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="w-12 px-2 py-2 text-left text-xs font-medium text-gray-500">
                        排名
                      </th>
                      <th
                        className="cursor-pointer select-none px-2 py-2 text-left text-xs font-medium text-gray-500 hover:text-blue-600"
                        onClick={() => toggleSort("name")}
                      >
                        <div className="flex items-center gap-1">
                          姓名 <SortIcon field="name" />
                        </div>
                      </th>
                      <th
                        className="cursor-pointer select-none px-2 py-2 text-center text-xs font-medium text-gray-500 hover:text-blue-600"
                        onClick={() => toggleSort("avg")}
                      >
                        <div className="flex items-center justify-center gap-1">
                          综合均分 <SortIcon field="avg" />
                        </div>
                      </th>
                      <th
                        className="cursor-pointer select-none px-2 py-2 text-center text-xs font-medium text-gray-500 hover:text-blue-600"
                        onClick={() => toggleSort("assignment")}
                      >
                        <div className="flex items-center justify-center gap-1">
                          作业均分 <SortIcon field="assignment" />
                        </div>
                      </th>
                      <th
                        className="cursor-pointer select-none px-2 py-2 text-center text-xs font-medium text-gray-500 hover:text-blue-600"
                        onClick={() => toggleSort("exam")}
                      >
                        <div className="flex items-center justify-center gap-1">
                          考试均分 <SortIcon field="exam" />
                        </div>
                      </th>
                      <th className="px-2 py-2 text-center text-xs font-medium text-gray-500">
                        次数
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {ranking.map((s, i) => (
                      <tr
                        key={s.studentId}
                        className="border-b border-gray-50 transition-colors hover:bg-blue-50/50"
                      >
                        <td className="px-2 py-2.5">{getRankBadge(i)}</td>
                        <td className="px-2 py-2.5 font-medium text-gray-800">
                          {s.studentName}
                        </td>
                        <td className="px-2 py-2.5 text-center">
                          <span
                            className={`font-bold ${getScoreColor(s.averageScore)}`}
                          >
                            {s.averageScore}
                          </span>
                        </td>
                        <td className="px-2 py-2.5 text-center">
                          <span
                            className={`text-gray-700 ${s.assignmentCount > 0 ? "" : "text-gray-300"}`}
                          >
                            {s.assignmentCount > 0 ? s.assignmentAvg : "-"}
                          </span>
                          <span className="ml-1 text-xs text-gray-300">
                            ({s.assignmentCount})
                          </span>
                        </td>
                        <td className="px-2 py-2.5 text-center">
                          <span
                            className={`text-gray-700 ${s.examCount > 0 ? "" : "text-gray-300"}`}
                          >
                            {s.examCount > 0 ? s.examAvg : "-"}
                          </span>
                          <span className="ml-1 text-xs text-gray-300">
                            ({s.examCount})
                          </span>
                        </td>
                        <td className="px-2 py-2.5 text-center text-xs text-gray-400">
                          {s.totalItems}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {/* Ranking summary */}
              <div className="mt-4 flex items-center justify-between border-t border-gray-100 pt-3 text-xs text-gray-500">
                <span>共 {ranking.length} 名学生</span>
                <span>
                  最高分{" "}
                  <span className="font-medium text-green-600">
                    {ranking[0]?.averageScore}
                  </span>
                  {" · "}
                  班级均分{" "}
                  <span className="font-medium text-blue-600">
                    {trends.summary.averageAssignmentScore > 0 ||
                    trends.summary.averageExamScore > 0
                      ? (
                          (trends.summary.averageAssignmentScore +
                            trends.summary.averageExamScore) /
                          2
                        ).toFixed(1)
                      : "-"}
                  </span>
                </span>
              </div>
            </div>
          )}

          {/* ── Assignment Trend (separate) ── */}
          <div className="card p-5">
            <h3 className="mb-4 flex items-center font-bold text-gray-900">
              <BookOpen className="mr-2 h-5 w-5 text-blue-600" />
              作业成绩趋势
              <span className="ml-2 text-xs font-normal text-gray-400">
                班级日均分
              </span>
            </h3>
            {renderLineChart(
              assignmentChart,
              "#3b82f6",
              "#60a5fa",
              "assignment",
            )}
          </div>

          {/* ── Exam Trend (separate) ── */}
          <div className="card p-5">
            <h3 className="mb-4 flex items-center font-bold text-gray-900">
              <FileText className="mr-2 h-5 w-5 text-purple-600" />
              考试成绩趋势
              <span className="ml-2 text-xs font-normal text-gray-400">
                班级日均分
              </span>
            </h3>
            {renderLineChart(examChart, "#8b5cf6", "#a78bfa", "exam")}
          </div>

          {/* ── Knowledge Area Analysis ── */}
          {knowledgeAreas.length > 0 && (
            <div className="card p-5">
              <h3 className="mb-4 flex items-center font-bold text-gray-900">
                <Brain className="mr-2 h-5 w-5 text-orange-500" />
                知识领域分析
                <span className="ml-2 text-xs font-normal text-gray-400">
                  错题分布
                </span>
              </h3>
              <div className="space-y-3">
                {knowledgeAreas.map((ka, i) => {
                  const pct =
                    maxKaMistakes > 0
                      ? (ka.mistakeCount / maxKaMistakes) * 100
                      : 0;
                  const severity =
                    pct >= 80 ? "red" : pct >= 50 ? "orange" : "yellow";
                  const barColor =
                    severity === "red"
                      ? "from-red-400 to-red-500"
                      : severity === "orange"
                        ? "from-orange-400 to-orange-500"
                        : "from-yellow-400 to-amber-500";
                  return (
                    <div
                      key={ka.knowledgeAreaId}
                      className="flex items-center gap-3"
                    >
                      <span
                        className="w-20 shrink-0 truncate text-right text-xs text-gray-500"
                        title={ka.name}
                      >
                        {ka.name}
                      </span>
                      <div className="relative h-7 flex-1 overflow-hidden rounded-full bg-gray-100">
                        <div
                          className={`bg-gradient-to-r ${barColor} flex h-full items-center rounded-full pl-2 transition-all duration-500`}
                          style={{ width: `${Math.max(pct, 5)}%` }}
                        >
                          {pct > 15 && (
                            <span className="whitespace-nowrap text-xs font-medium text-white">
                              {ka.mistakeCount}题
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="w-16 shrink-0 text-right">
                        <span className="text-xs text-gray-500">
                          {ka.affectedStudentCount}人
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="mt-3 flex items-center gap-4 border-t border-gray-100 pt-3 text-xs text-gray-400">
                <span>共 {knowledgeAreas.length} 个知识领域</span>
                <span>
                  总计 {knowledgeAreas.reduce((s, k) => s + k.mistakeCount, 0)}{" "}
                  道错题
                </span>
              </div>
            </div>
          )}

          {/* ── Mistake Trend ── */}
          {trends.mistakeTrends && trends.mistakeTrends.length > 0 && (
            <div className="card p-5">
              <h3 className="mb-4 flex items-center font-bold text-gray-900">
                <AlertTriangle className="mr-2 h-5 w-5 text-orange-500" />
                错题趋势
              </h3>
              <div className="space-y-2">
                {trends.mistakeTrends.slice(-10).map((item, i) => {
                  const maxMistakes = Math.max(
                    ...trends.mistakeTrends.map((m) => m.mistakes),
                  );
                  const width =
                    maxMistakes > 0 ? (item.mistakes / maxMistakes) * 100 : 0;
                  return (
                    <div key={i} className="flex items-center gap-3">
                      <span className="w-16 shrink-0 text-xs text-gray-400">
                        {formatDate(item.date)}
                      </span>
                      <div className="relative h-6 flex-1 rounded-full bg-gray-100">
                        <div
                          className="flex h-full items-center justify-end rounded-full bg-gradient-to-r from-orange-400 to-red-500 pr-2 transition-all duration-500"
                          style={{ width: `${Math.max(width, 8)}%` }}
                        >
                          <span className="text-xs font-medium text-white">
                            {item.mistakes}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="py-16 text-center text-gray-400">暂无数据</div>
      )}
    </div>
  );
}
