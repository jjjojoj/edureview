import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, Fragment, Suspense } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useTRPC } from "~/trpc/react";
import { useAuthStore } from "~/stores/authStore";
import { RequireAuth } from "~/components/RequireAuth";
import { AddStudentModal } from "~/components/AddStudentModal";
import { ReportGenerationModal } from "~/components/ReportGenerationModal";
import { ArchiveClassModal } from "~/components/ArchiveClassModal";
import { EnhancedTeacherAssignmentUpload } from "~/components/EnhancedTeacherAssignmentUpload";
import { TeachingMaterialLibrary } from "~/components/TeachingMaterialLibrary";
import { TargetedQuestionGenerator } from "~/components/TargetedQuestionGenerator";
import { ClassStatsCards, ClassInfoSidebar } from "~/components/class/ClassOverview";
import { ClassStudents } from "~/components/class/ClassStudents";
import { ClassPerformanceChart } from "~/components/ClassPerformanceChart";
import { TimeRangeSelector } from "~/components/TimeRangeSelector";
import { Transition } from "@headlessui/react";
import { GroupSelectionModal } from "~/components/GroupSelectionModal";
import { ConfirmDialog } from "~/components/ConfirmDialog";
import {
  ArrowLeft,
  Users,
  BookOpen,
  BarChart3,
  Upload,
  UserPlus,
  Brain,
  ChevronRight,
  Trash2,
  Loader2,
  Clock,
  Check,
  Copy,
} from "lucide-react";
import { useToast } from "~/components/Toast";
import { getErrorMessage } from "~/utils/trpcError";

export const Route = createFileRoute("/classes/$classId/")({
  component: ClassDetail,
});

function ClassDetail() {
  const navigate = useNavigate();
  const { classId } = Route.useParams();
  const { authToken, teacher } = useAuthStore();
  const [showAddStudentModal, setShowAddStudentModal] = useState(false);
  const [showAssignmentUpload, setShowAssignmentUpload] = useState(false);
  const [showInvitationCode, setShowInvitationCode] = useState(false);
  const [timeRange, setTimeRange] = useState<"7d" | "30d" | "90d" | "1y" | "all">("30d");
  const [showReportModal, setShowReportModal] = useState(false);
  const [showArchiveModal, setShowArchiveModal] = useState(false);
  const [showTeachingMaterials, setShowTeachingMaterials] = useState(false);
  const [showQuestionGenerator, setShowQuestionGenerator] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [showGroupModal, setShowGroupModal] = useState(false);
  const [selectedStudentForGroup, setSelectedStudentForGroup] = useState<any>(null);

  const trpc = useTRPC();
  const toast = useToast();
  const refreshInvitationCodeMutation = useMutation(trpc.refreshInvitationCode.mutationOptions());
  const deleteStudentMutation = useMutation(trpc.deleteStudentFromClass.mutationOptions());
  const toggleSpecialAttentionMutation = useMutation(trpc.toggleSpecialAttention.mutationOptions());
  const assignStudentToGroupMutation = useMutation(trpc.assignStudentToGroup.mutationOptions());
  const createStudentGroupMutation = useMutation(trpc.createStudentGroup.mutationOptions());

  const studentsQuery = useQuery({
    ...trpc.getClassStudents.queryOptions({
      authToken: authToken || "",
      classId: parseInt(classId),
    }),
    enabled: !!authToken && !!classId,
  });

  const progressQuery = useQuery({
    ...trpc.analyzeClassProgress.queryOptions({
      authToken: authToken || "",
      classId: parseInt(classId),
    }),
    enabled: !!authToken && !!classId,
  });

  const classPerformanceTrendsQuery = useQuery({
    ...trpc.getClassPerformanceTrends.queryOptions({
      authToken: authToken || "",
      classId: parseInt(classId),
      timeRange: timeRange,
    }),
    enabled: !!authToken && !!classId,
  });

  const groupsQuery = useQuery({
    ...trpc.getClassGroups.queryOptions({
      authToken: authToken || "",
      classId: parseInt(classId),
    }),
    enabled: !!authToken && !!classId,
  });

  // ── Handlers ──────────────────────────────────────────────────

  const handleRefreshInvitationCode = async () => {
    if (!authToken) return;
    try {
      await refreshInvitationCodeMutation.mutateAsync({
        authToken,
        classId: parseInt(classId),
      });
      toast.success("邀请码已刷新！");
      studentsQuery.refetch();
    } catch (error: unknown) {
      toast.error(getErrorMessage(error));
    }
  };

  const handleStudentClick = (studentId: number) => {
    navigate({
      to: "/classes/$classId/students/$studentId",
      params: { classId, studentId: studentId.toString() },
    });
  };

  const handleDeleteStudent = (student: any) => {
    setSelectedStudent(student);
    setShowDeleteConfirm(true);
  };

  const confirmDeleteStudent = async () => {
    if (!selectedStudent || !authToken) return;
    try {
      const result = await deleteStudentMutation.mutateAsync({
        authToken,
        studentId: selectedStudent.id,
      });
      if (result.success) {
        toast.success(
          `学生 ${selectedStudent.name} 已删除${result.inheritanceApplied ? "，学号已自动继承" : ""}`
        );
        setShowDeleteConfirm(false);
        setSelectedStudent(null);
        studentsQuery.refetch();
      }
    } catch (error: unknown) {
      toast.error(getErrorMessage(error));
    }
  };

  const handleSpecialAttention = async (student: any) => {
    if (!authToken) return;
    try {
      const result = await toggleSpecialAttentionMutation.mutateAsync({
        authToken,
        studentId: student.id,
      });
      if (result.success) {
        const actionText = result.action === "added" ? "添加" : "取消";
        toast.success(`已${actionText}特别关注: ${student.name}`);
        studentsQuery.refetch();
      }
    } catch (error: unknown) {
      toast.error(getErrorMessage(error));
    }
  };

  const handleAddToGroup = (student: any) => {
    setSelectedStudentForGroup(student);
    setShowGroupModal(true);
  };

  const handleAssignToGroup = async (studentId: number, groupId: number | null) => {
    if (!authToken) return;
    try {
      const result = await assignStudentToGroupMutation.mutateAsync({
        authToken,
        studentId,
        groupId,
      });
      if (result.success) {
        const actionText = result.action === "assigned" ? "分配到小组" : "移出小组";
        const groupText = result.student.group ? result.student.group.name : "无小组";
        toast.success(`学生 ${result.student.name} 已${actionText}: ${groupText}`);
        studentsQuery.refetch();
        groupsQuery.refetch();
      }
    } catch (error: unknown) {
      toast.error(getErrorMessage(error));
    }
  };

  const handleCreateGroup = async (
    name: string,
    description?: string,
    color: string = "blue"
  ) => {
    if (!authToken) return;
    try {
      const result = await createStudentGroupMutation.mutateAsync({
        authToken,
        classId: parseInt(classId),
        name,
        description,
        color,
      });
      if (result.success) {
        groupsQuery.refetch();
      }
    } catch (error: unknown) {
      toast.error(getErrorMessage(error));
      throw error;
    }
  };

  if (!teacher) {
    return null;
  }

  const classData = studentsQuery.data?.class;
  const students = studentsQuery.data?.students || [];
  const totalAssignments = students.reduce(
    (sum, student) => sum + student._count.assignments,
    0
  );
  const totalExams = students.reduce(
    (sum, student) => sum + student._count.exams,
    0
  );

  return (
    <RequireAuth>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-indigo-50/30">
        <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>

        <header className="relative bg-white/80 backdrop-blur-xl border-b border-gray-200/50 shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => navigate({ to: "/dashboard" })}
                  className="p-2 text-gray-400 hover:text-gray-600 rounded-xl hover:bg-gray-100 transition-all"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-gradient-primary rounded-xl flex items-center justify-center mr-3 shadow-glow">
                    <BookOpen className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h1 className="text-xl font-bold text-gray-900">
                      {classData?.name || "加载中..."}
                    </h1>
                    {classData?.description && (
                      <p className="text-sm text-gray-500">{classData.description}</p>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <button onClick={() => setShowReportModal(true)} className="btn-secondary text-sm px-3 py-2 group">
                  <BarChart3 className="w-4 h-4 mr-1" />
                  生成报告
                </button>
                <button
                  onClick={() => setShowInvitationCode(!showInvitationCode)}
                  className="btn-secondary text-sm px-3 py-2 group"
                >
                  <Users className="w-4 h-4 mr-1" />
                  邀请码
                  <ChevronRight className={`w-3 h-3 ml-1 transition-transform ${showInvitationCode ? "rotate-90" : ""}`} />
                </button>
                <button onClick={() => setShowTeachingMaterials(true)} className="btn-secondary text-sm px-3 py-2 group">
                  <BookOpen className="w-4 h-4 mr-1" />
                  资料库
                </button>
                <button onClick={() => setShowQuestionGenerator(true)} className="btn-secondary text-sm px-3 py-2 group">
                  <Brain className="w-4 h-4 mr-1" />
                  题目生成
                </button>
                <button onClick={() => setShowAssignmentUpload(true)} className="btn-secondary text-sm px-3 py-2 group">
                  <Upload className="w-4 h-4 mr-1" />
                  上传作业
                </button>
                <button onClick={() => setShowAddStudentModal(true)} className="btn-primary text-sm px-3 py-2 group">
                  <UserPlus className="w-4 h-4 mr-1" />
                  添加学生
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Invitation Code Section */}
        {showInvitationCode && classData && (
          <InvitationCodeSection
            classData={classData}
            isRefreshing={refreshInvitationCodeMutation.isPending}
            onRefresh={handleRefreshInvitationCode}
          />
        )}

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Stats Cards */}
          <ClassStatsCards
            studentsCount={students.length}
            totalAssignments={totalAssignments}
            totalExams={totalExams}
            progressQuery={progressQuery}
          />

          {/* Class Performance Trends */}
          <div className="mb-8">
            <div className="card animate-slide-up">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-bold text-gray-900">班级表现趋势</h3>
                  <Suspense fallback={<div className="text-sm text-gray-500">加载中...</div>}>
                    <TimeRangeSelector value={timeRange} onChange={setTimeRange} />
                  </Suspense>
                </div>
              </div>
              <div className="p-6">
                <Suspense
                  fallback={
                    <div className="flex items-center justify-center h-96">
                      <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                    </div>
                  }
                >
                  <ClassPerformanceChart
                    data={{
                      performanceTrends: classPerformanceTrendsQuery.data?.performanceTrends || [],
                      participationTrends: classPerformanceTrendsQuery.data?.participationTrends || [],
                      mistakeTrends: classPerformanceTrendsQuery.data?.mistakeTrends || [],
                    }}
                    height={400}
                  />
                </Suspense>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Students Section */}
            <div className="lg:col-span-3">
              <ClassStudents
                students={students}
                onStudentClick={handleStudentClick}
                onDeleteStudent={handleDeleteStudent}
                onSpecialAttention={handleSpecialAttention}
                onAddToGroup={handleAddToGroup}
                onShowAddStudentModal={() => setShowAddStudentModal(true)}
              />
            </div>

            {/* Class Info Sidebar */}
            <div>
              <ClassInfoSidebar
                classData={classData}
                teacherName={teacher.name}
                progressQuery={progressQuery}
                onShowArchiveModal={() => setShowArchiveModal(true)}
              />
            </div>
          </div>
        </div>

        {/* Modals */}
        <AddStudentModal
          isOpen={showAddStudentModal}
          onClose={() => setShowAddStudentModal(false)}
          classId={parseInt(classId)}
          onSuccess={() => {
            studentsQuery.refetch();
            toast.success("学生添加成功！");
          }}
        />

        <ReportGenerationModal
          isOpen={showReportModal}
          onClose={() => setShowReportModal(false)}
          classId={parseInt(classId)}
          className={classData?.name || ""}
        />

        <ArchiveClassModal
          isOpen={showArchiveModal}
          onClose={() => setShowArchiveModal(false)}
          classId={parseInt(classId)}
          className={classData?.name || ""}
          onSuccess={() => {
            setShowArchiveModal(false);
            navigate({ to: "/dashboard" });
          }}
        />

        <EnhancedTeacherAssignmentUpload
          isOpen={showAssignmentUpload}
          onClose={() => setShowAssignmentUpload(false)}
          classId={parseInt(classId)}
          students={students.map((s) => ({ id: s.id, name: s.name }))}
          onSuccess={(uploadedCount) => {
            toast.success(`成功上传 ${uploadedCount} 个作业！`);
            setShowAssignmentUpload(false);
            studentsQuery.refetch();
          }}
        />

        {showTeachingMaterials && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-hidden">
              <TeachingMaterialLibrary onClose={() => setShowTeachingMaterials(false)} />
            </div>
          </div>
        )}

        {showQuestionGenerator && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-auto">
              <TargetedQuestionGenerator
                classId={parseInt(classId)}
                onClose={() => setShowQuestionGenerator(false)}
              />
            </div>
          </div>
        )}

        {/* Delete Student Confirmation Dialog */}
        <ConfirmDialog
          isOpen={showDeleteConfirm}
          title="确认删除学生"
          message={
            <>
              您确定要删除学生 <span className="font-semibold text-gray-900">{selectedStudent?.name}</span> 吗？
              <p className="text-sm text-red-600 mt-2">此操作将永久删除该学生的所有数据，包括作业、考试记录等，且无法恢复。</p>
            </>
          }
          confirmLabel="确认删除"
          cancelLabel="取消"
          destructive
          isLoading={deleteStudentMutation.isPending}
          onConfirm={confirmDeleteStudent}
          onCancel={() => setShowDeleteConfirm(false)}
        />

        {/* Group Selection Modal */}
        {selectedStudentForGroup && (
          <GroupSelectionModal
            isOpen={showGroupModal}
            onClose={() => {
              setShowGroupModal(false);
              setSelectedStudentForGroup(null);
            }}
            student={selectedStudentForGroup}
            groups={groupsQuery.data?.groups || []}
            onAssignToGroup={handleAssignToGroup}
            onCreateGroup={handleCreateGroup}
          />
        )}
      </div>
    </RequireAuth>
  );
}

// ── Invitation Code Section (inline sub-component) ───────────────

interface InvitationCodeSectionProps {
  classData: {
    invitationCode: string;
    invitationCodeExpiresAt: string;
  };
  isRefreshing: boolean;
  onRefresh: () => void;
}

function InvitationCodeSection({ classData, isRefreshing, onRefresh }: InvitationCodeSectionProps) {
  const [copied, setCopied] = useState(false);

  const copyCode = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      toast.success("邀请码已复制到剪贴板！");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("复制邀请码失败");
    }
  };

  return (
    <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
      <div className="card bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200 animate-slide-down">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <Users className="w-6 h-6 text-blue-600 mr-3" />
              <h3 className="text-lg font-bold text-gray-900">学生邀请码</h3>
            </div>
            <button onClick={onRefresh} disabled={isRefreshing} className="btn-secondary text-sm group">
              {isRefreshing ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" />刷新中...</>
              ) : (
                "刷新邀请码"
              )}
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl p-4 border-2 border-blue-200">
              <div className="text-center">
                <div className="text-sm text-gray-600 mb-2">当前邀请码</div>
                <div className="text-3xl font-bold text-blue-700 tracking-wider mb-3">
                  {classData.invitationCode}
                </div>
                <button
                  onClick={() => copyCode(classData.invitationCode)}
                  className={`w-full py-2 px-4 rounded-lg font-semibold transition-all ${
                    copied
                      ? "bg-green-100 text-green-700 border border-green-200"
                      : "bg-blue-100 text-blue-700 border border-blue-200 hover:bg-blue-200"
                  }`}
                >
                  {copied ? (
                    <><Check className="w-4 h-4 mr-2 inline" />已复制！</>
                  ) : (
                    <><Copy className="w-4 h-4 mr-2 inline" />复制代码</>
                  )}
                </button>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">过期时间</span>
                <div className="flex items-center text-sm font-medium text-gray-900">
                  <Clock className="w-4 h-4 mr-1" />
                  {new Date(classData.invitationCodeExpiresAt).toLocaleString("zh-CN")}
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">剩余时间</span>
                <span className="text-sm font-medium text-orange-600">
                  {Math.max(0, Math.ceil((new Date(classData.invitationCodeExpiresAt).getTime() - Date.now()) / (1000 * 60 * 60)))} 小时
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
