import { useEffect, useState } from "react";
import { useTRPC } from "~/trpc/react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useToast } from "~/components/Toast";
import {
  Brain,
  User,
  Target,
  Settings,
  Lightbulb,
  Search,
  Users,
  Loader2,
  GraduationCap,
  CheckCircle2,
  UserPlus,
} from "lucide-react";
import { useAuthStore } from "~/stores/authStore";
import {
  GeneratedQuestionsDisplay,
  type QuestionGenerationResult,
} from "~/components/question/GeneratedQuestionsDisplay";
import { getErrorMessage } from "~/utils/trpcError";

type DifficultyLevel = "easy" | "medium" | "hard";
type GeneratorMode = "student" | "class";

interface QuestionGenerationPayload {
  questions: QuestionGenerationResult["questions"];
  summary: string;
}

interface StudentQuestionGenerationResponse {
  questions: QuestionGenerationPayload;
  mistakesAnalyzed: number;
  materialsUsed: number;
  modelUsed: string;
  studentName: string;
}

interface ClassQuestionGenerationResponse {
  questions: QuestionGenerationPayload;
  totalMistakes: number;
  materialsUsed: number;
  modelUsed: string;
  className: string;
}

interface TargetedQuestionGeneratorProps {
  classId?: number;
  studentId?: number;
  onClose?: () => void;
  showHeader?: boolean;
  variant?: "modal" | "page";
}

export function TargetedQuestionGenerator({
  classId: propClassId,
  studentId: propStudentId,
  onClose,
  showHeader = true,
  variant = "modal",
}: TargetedQuestionGeneratorProps) {
  const toast = useToast();
  const trpc = useTRPC();
  const { authToken } = useAuthStore();
  const [generatedQuestions, setGeneratedQuestions] =
    useState<QuestionGenerationResult | null>(null);
  const [selectedClassId, setSelectedClassId] = useState<number | null>(
    propClassId || null,
  );
  const [selectedStudentIds, setSelectedStudentIds] = useState<number[]>(
    propStudentId ? [propStudentId] : [],
  );
  const [questionCount, setQuestionCount] = useState(5);
  const [difficultyLevel, setDifficultyLevel] =
    useState<DifficultyLevel>("medium");
  const [mode, setMode] = useState<GeneratorMode>("student");
  const [searchQuery, setSearchQuery] = useState("");

  // Get classes
  const classesQuery = useQuery({
    ...trpc.getTeacherClasses.queryOptions({ authToken: authToken || "" }),
    enabled: !!authToken,
  });

  useEffect(() => {
    setSelectedClassId(propClassId || null);
  }, [propClassId]);

  useEffect(() => {
    setSelectedStudentIds(propStudentId ? [propStudentId] : []);
  }, [propStudentId]);

  // Get students for selected class
  const studentsQuery = useQuery({
    ...trpc.getClassStudents.queryOptions({
      authToken: authToken || "",
      classId: selectedClassId!,
    }),
    enabled: !!selectedClassId && !!authToken,
  });

  const classes = classesQuery.data?.classes || [];
  const students = studentsQuery.data?.students || [];
  const filteredStudents = searchQuery
    ? students.filter((s) => s.name.includes(searchQuery))
    : students;

  const toggleStudent = (studentId: number) => {
    setSelectedStudentIds((prev) =>
      prev.includes(studentId)
        ? prev.filter((id) => id !== studentId)
        : [...prev, studentId],
    );
  };

  const selectAll = () => {
    setSelectedStudentIds(filteredStudents.map((s) => s.id));
  };

  const clearSelection = () => {
    setSelectedStudentIds([]);
  };

  const generateStudentMutation = useMutation(
    trpc.generateTargetedQuestions.mutationOptions(),
  );
  const generateClassMutation = useMutation(
    trpc.generateClassQuestions.mutationOptions(),
  );

  const isGenerating =
    generateStudentMutation.isPending || generateClassMutation.isPending;

  const normalizeGenerationResult = (
    result: StudentQuestionGenerationResponse | ClassQuestionGenerationResponse,
  ): QuestionGenerationResult => ({
    questions: result.questions.questions,
    summary: result.questions.summary,
    mistakesAnalyzed:
      "mistakesAnalyzed" in result
        ? result.mistakesAnalyzed
        : result.totalMistakes,
    materialsUsed: result.materialsUsed,
    modelUsed: result.modelUsed,
    studentName:
      "studentName" in result ? result.studentName : result.className,
  });

  const handleGenerate = async () => {
    if (!authToken) {
      toast.error("请先登录");
      return;
    }

    try {
      if (mode === "class") {
        if (!selectedClassId) {
          toast.error("请选择班级");
          return;
        }

        const result = await generateClassMutation.mutateAsync({
          authToken,
          classId: selectedClassId,
          questionCount,
          difficultyLevel,
        });
        const normalized = normalizeGenerationResult(
          result as ClassQuestionGenerationResponse,
        );
        setGeneratedQuestions(normalized);
        toast.success(
          `成功为 ${normalized.studentName} 生成 ${normalized.questions.length} 道练习题！`,
        );
      } else {
        if (selectedStudentIds.length === 0) {
          toast.error("请至少选择一个学生");
          return;
        }

        if (selectedStudentIds.length > 1) {
          if (!selectedClassId) {
            toast.error("请选择班级");
            return;
          }

          const result = await generateClassMutation.mutateAsync({
            authToken,
            classId: selectedClassId,
            questionCount,
            difficultyLevel,
          });
          const normalized = normalizeGenerationResult(
            result as ClassQuestionGenerationResponse,
          );
          setGeneratedQuestions(normalized);
          toast.success(
            `已按班级共性薄弱点生成 ${normalized.questions.length} 道练习题！`,
          );
          return;
        }

        const studentId = selectedStudentIds[0];
        if (!studentId) {
          toast.error("请至少选择一个学生");
          return;
        }

        const result = await generateStudentMutation.mutateAsync({
          authToken,
          studentId,
          questionCount,
          difficultyLevel,
        });
        const normalized = normalizeGenerationResult(
          result as StudentQuestionGenerationResponse,
        );
        setGeneratedQuestions(normalized);
        toast.success(
          `成功为 ${normalized.studentName} 生成 ${normalized.questions.length} 道练习题！`,
        );
      }
    } catch (error: unknown) {
      toast.error(getErrorMessage(error));
    }
  };

  // If questions have been generated, show the results
  if (generatedQuestions) {
    return (
      <GeneratedQuestionsDisplay
        result={generatedQuestions}
        onRegenerate={() => setGeneratedQuestions(null)}
        onClose={onClose}
      />
    );
  }

  const selectedStudents = students.filter((student) =>
    selectedStudentIds.includes(student.id),
  );

  return (
    <div
      className={
        variant === "page"
          ? "rounded-lg border border-slate-200 bg-white p-6 shadow-sm"
          : "p-6"
      }
    >
      {showHeader ? (
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center">
            <div className="mr-3 flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-purple-500 to-pink-600">
              <Brain className="h-6 w-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">生成练习题</h2>
              <p className="text-sm text-gray-500">
                基于错题库智能生成针对性练习
              </p>
            </div>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="text-2xl leading-none text-gray-400 hover:text-gray-600"
            >
              &times;
            </button>
          )}
        </div>
      ) : null}

      {/* Mode Toggle */}
      <div className="mb-6 flex gap-2">
        <button
          onClick={() => {
            setMode("student");
            setGeneratedQuestions(null);
          }}
          className={`flex flex-1 items-center justify-center gap-2 rounded-xl py-3 text-sm font-medium transition-all ${
            mode === "student"
              ? "shadow-glow bg-purple-600 text-white"
              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          }`}
        >
          <User className="h-4 w-4" />
          选择学生
        </button>
        <button
          onClick={() => {
            setMode("class");
            setGeneratedQuestions(null);
          }}
          className={`flex flex-1 items-center justify-center gap-2 rounded-xl py-3 text-sm font-medium transition-all ${
            mode === "class"
              ? "shadow-glow bg-purple-600 text-white"
              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          }`}
        >
          <Users className="h-4 w-4" />
          全班练习
        </button>
      </div>

      {/* Step 1: Select Class */}
      <div className="mb-5">
        <label className="mb-2 block text-sm font-medium text-gray-700">
          <GraduationCap className="mr-1 inline h-4 w-4" />
          选择班级
        </label>
        {propClassId ? (
          <div className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-gray-700">
            {classes.find((c) => c.id === propClassId)?.name ||
              `班级 ${propClassId}`}
          </div>
        ) : (
          <select
            value={selectedClassId || ""}
            onChange={(e) => {
              const id = e.target.value ? Number(e.target.value) : null;
              setSelectedClassId(id);
              setSelectedStudentIds([]);
              setSearchQuery("");
            }}
            className="w-full rounded-xl border border-gray-300 bg-white px-4 py-2.5 focus:border-purple-500 focus:ring-2 focus:ring-purple-500"
          >
            <option value="">请选择班级</option>
            {classes.map((cls) => (
              <option key={cls.id} value={cls.id}>
                {cls.name}（{cls._count.students}人）
              </option>
            ))}
          </select>
        )}
      </div>

      {/* Step 2: Select Student(s) — multi-select for individual mode */}
      {mode === "student" && (
        <div className="mb-5">
          <label className="mb-2 block text-sm font-medium text-gray-700">
            <UserPlus className="mr-1 inline h-4 w-4" />
            选择学生
            {selectedStudentIds.length > 0 && (
              <span className="ml-2 text-purple-600">
                （已选 {selectedStudentIds.length} 人）
              </span>
            )}
          </label>

          {/* Selected student tags */}
          {selectedStudentIds.length > 0 && (
            <div className="mb-2 flex flex-wrap gap-1.5">
              {selectedStudents.map((student) => (
                <span
                  key={student.id}
                  className="inline-flex items-center gap-1 rounded-lg border border-purple-200 bg-purple-50 px-2.5 py-1 text-xs text-purple-700"
                >
                  <User className="h-3 w-3" />
                  {student.name}
                  <button
                    onClick={() => toggleStudent(student.id)}
                    className="ml-0.5 text-purple-400 hover:text-purple-600"
                  >
                    &times;
                  </button>
                </span>
              ))}
              <button
                onClick={clearSelection}
                className="px-2 py-1 text-xs text-gray-500 hover:text-red-500"
              >
                清空
              </button>
            </div>
          )}

          {/* Search */}
          {students.length > 5 && (
            <div className="relative mb-2">
              <input
                type="text"
                placeholder="搜索学生姓名..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                disabled={!selectedClassId}
                className="w-full rounded-xl border border-gray-300 bg-white px-4 py-2 text-sm focus:border-purple-500 focus:ring-2 focus:ring-purple-500 disabled:bg-gray-100 disabled:text-gray-400"
              />
              <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            </div>
          )}

          {/* Select All / None buttons */}
          {selectedClassId && students.length > 0 && !propStudentId && (
            <div className="mb-2 flex gap-2">
              <button
                onClick={selectAll}
                className="rounded px-2 py-1 text-xs text-purple-600 transition-colors hover:bg-purple-50 hover:text-purple-800"
              >
                全选当前{searchQuery ? "搜索结果" : ""}
              </button>
              <span className="text-gray-300">|</span>
              <button
                onClick={clearSelection}
                className="rounded px-2 py-1 text-xs text-gray-500 transition-colors hover:bg-gray-50 hover:text-red-500"
              >
                取消全选
              </button>
            </div>
          )}

          {/* Student list */}
          <div className="max-h-48 overflow-y-auto rounded-xl border border-gray-200">
            {!selectedClassId ? (
              <div className="py-6 text-center text-sm text-gray-400">
                请先选择班级
              </div>
            ) : studentsQuery.isLoading ? (
              <div className="flex items-center justify-center py-6">
                <Loader2 className="mr-2 h-5 w-5 animate-spin text-purple-500" />
                <span className="text-sm text-gray-400">加载中...</span>
              </div>
            ) : filteredStudents.length === 0 ? (
              <div className="py-6 text-center text-sm text-gray-400">
                {searchQuery ? "未找到匹配的学生" : "该班级暂无学生"}
              </div>
            ) : (
              filteredStudents.map((s) => (
                <button
                  key={s.id}
                  onClick={() => toggleStudent(s.id)}
                  className={`flex w-full items-center justify-between px-4 py-2.5 text-left text-sm transition-colors hover:bg-purple-50 ${
                    selectedStudentIds.includes(s.id)
                      ? "bg-purple-50 text-purple-700"
                      : "text-gray-700"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <div
                      className={`flex h-4 w-4 items-center justify-center rounded border-2 transition-all ${
                        selectedStudentIds.includes(s.id)
                          ? "border-purple-600 bg-purple-600"
                          : "border-gray-300"
                      }`}
                    >
                      {selectedStudentIds.includes(s.id) && (
                        <svg
                          className="h-3 w-3 text-white"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={3}
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                      )}
                    </div>
                    <span>{s.name}</span>
                  </div>
                  {selectedStudentIds.includes(s.id) && (
                    <CheckCircle2 className="h-4 w-4 text-purple-600" />
                  )}
                </button>
              ))
            )}
          </div>
        </div>
      )}

      {/* Step 3: Settings */}
      <div className="mb-6 grid grid-cols-2 gap-4">
        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">
            <Target className="mr-1 inline h-4 w-4" />
            题目数量
          </label>
          <select
            value={questionCount}
            onChange={(e) => setQuestionCount(Number(e.target.value))}
            className="w-full rounded-xl border border-gray-300 bg-white px-4 py-2.5 focus:border-purple-500 focus:ring-2 focus:ring-purple-500"
          >
            {[1, 3, 5, 8, 10, 15, 20].map((count) => (
              <option key={count} value={count}>
                {count} 道题
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">
            <Settings className="mr-1 inline h-4 w-4" />
            难度等级
          </label>
          <div className="flex gap-2">
            {[
              { value: "easy" as const, label: "简单" },
              { value: "medium" as const, label: "中等" },
              { value: "hard" as const, label: "困难" },
            ].map((level) => (
              <button
                key={level.value}
                onClick={() => setDifficultyLevel(level.value)}
                className={`flex-1 rounded-xl py-2.5 text-sm font-medium transition-all ${
                  difficultyLevel === level.value
                    ? "shadow-glow bg-purple-600 text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {level.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Generate Button */}
      <div className="flex gap-3">
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-xl border border-gray-300 bg-gray-100 px-4 py-3 text-sm font-medium text-gray-700 transition-all hover:bg-gray-200"
          >
            取消
          </button>
        )}
        <button
          onClick={() => {
            void handleGenerate();
          }}
          disabled={
            isGenerating ||
            !selectedClassId ||
            (mode === "student" && selectedStudentIds.length === 0)
          }
          className="btn-primary flex-1 py-3 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isGenerating ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              正在生成...
            </>
          ) : (
            <>
              <Brain className="mr-2 h-4 w-4" />
              {mode === "class"
                ? "为全班生成练习题"
                : selectedStudentIds.length > 1
                  ? "按共性薄弱点生成"
                  : "为学生生成练习题"}
            </>
          )}
        </button>
      </div>

      {/* Info Box */}
      <div className="mt-6 rounded-xl border border-purple-200 bg-purple-50 p-4">
        <div className="flex items-start space-x-2">
          <Lightbulb className="mt-0.5 h-5 w-5 shrink-0 text-purple-600" />
          <div className="text-sm text-purple-800">
            <p className="mb-1 font-medium">
              {mode === "class"
                ? "AI 将基于全班高频错题生成练习题"
                : selectedStudentIds.length > 1
                  ? `当前将按所选班级的共性薄弱点生成练习题`
                  : "AI 将基于学生个人错题生成练习题"}
            </p>
            <ul className="list-inside list-disc space-y-1 text-purple-700">
              <li>分析历史错题记录和错误模式</li>
              <li>结合教学资料库作为参考</li>
              <li>针对性设计题目和详细解析</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
