import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, Fragment, Suspense } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useTRPC } from "~/trpc/react";
import { useAuthStore } from "~/stores/authStore";
import { AddStudentModal } from "~/components/AddStudentModal";
import { ReportGenerationModal } from "~/components/ReportGenerationModal";
import { ArchiveClassModal } from "~/components/ArchiveClassModal";
import { EnhancedTeacherAssignmentUpload } from "~/components/EnhancedTeacherAssignmentUpload";
import { TeachingMaterialLibrary } from "~/components/TeachingMaterialLibrary";
import { TargetedQuestionGenerator } from "~/components/TargetedQuestionGenerator";
import { RightClickMenu, ContextMenuItem } from "~/components/ContextMenu";
import { GroupSelectionModal } from "~/components/GroupSelectionModal";
import { Menu, Transition } from "@headlessui/react";
import { ProgressInsightPanel } from "~/components/ProgressInsightPanel";
import { ClassPerformanceChart } from "~/components/ClassPerformanceChart";
import { TimeRangeSelector } from "~/components/TimeRangeSelector";
import {
  ArrowLeft,
  Users,
  BookOpen,
  FileText,
  Mail,
  Calendar,
  TrendingUp,
  Upload,
  MoreVertical,
  UserPlus,
  Search,
  Sparkles,
  GraduationCap,
  Star,
  Target,
  Award,
  Clock,
  BarChart3,
  ChevronRight,
  Copy,
  Check,
  Loader2,
  Archive,
  Brain,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  SortAsc,
  SortDesc,
  Trash2,
  Heart,
  Group,
} from "lucide-react";
import toast from "react-hot-toast";

// 改为静态导入，避免动态导入在 tsr-split 模式下加载失败

export const Route = createFileRoute("/classes/$classId/")({
  component: ClassDetail,
});

function ClassDetail() {
  const navigate = useNavigate();
  const { classId } = Route.useParams();
  const { authToken, teacher, isAuthenticated } = useAuthStore();
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState<'name' | 'studentId' | 'performance' | 'potential'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [showAddStudentModal, setShowAddStudentModal] = useState(false);
  const [showAssignmentUpload, setShowAssignmentUpload] = useState(false);
  const [showExamUpload, setShowExamUpload] = useState(false);
  const [showInvitationCode, setShowInvitationCode] = useState(false);
  const [invitationCodeCopied, setInvitationCodeCopied] = useState(false);
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d' | '1y' | 'all'>('30d');
  const [showReportModal, setShowReportModal] = useState(false);
  const [showArchiveModal, setShowArchiveModal] = useState(false);
  const [showTeachingMaterials, setShowTeachingMaterials] = useState(false);
  const [showQuestionGenerator, setShowQuestionGenerator] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [showGroupModal, setShowGroupModal] = useState(false);
  const [selectedStudentForGroup, setSelectedStudentForGroup] = useState<any>(null);

  const trpc = useTRPC();
  const refreshInvitationCodeMutation = useMutation(trpc.refreshInvitationCode.mutationOptions());

  useEffect(() => {
    if (!isAuthenticated || !authToken) {
      navigate({ to: "/auth" });
    }
  }, [isAuthenticated, authToken, navigate]);

  const studentsQuery = useQuery({
    ...trpc.getClassStudents.queryOptions({
      authToken: authToken || "",
      classId: parseInt(classId)
    }),
    enabled: !!authToken && !!classId,
  });

  const progressQuery = useQuery({
    ...trpc.analyzeClassProgress.queryOptions({
      authToken: authToken || "",
      classId: parseInt(classId)
    }),
    enabled: !!authToken && !!classId,
  });

  const classPerformanceTrendsQuery = useQuery({
    ...trpc.getClassPerformanceTrends.queryOptions({
      authToken: authToken || "",
      classId: parseInt(classId),
      timeRange: timeRange
    }),
    enabled: !!authToken && !!classId,
  });

  const groupsQuery = useQuery({
    ...trpc.getClassGroups.queryOptions({
      authToken: authToken || "",
      classId: parseInt(classId)
    }),
    enabled: !!authToken && !!classId,
  });

  const copyInvitationCode = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setInvitationCodeCopied(true);
      toast.success("邀请码已复制到剪贴板！");
      setTimeout(() => setInvitationCodeCopied(false), 2000);
    } catch (error) {
      toast.error("复制邀请码失败");
    }
  };

  const handleRefreshInvitationCode = async () => {
    if (!authToken) return;

    try {
      await refreshInvitationCodeMutation.mutateAsync({
        authToken,
        classId: parseInt(classId),
      });

      toast.success("邀请码已刷新！");
      studentsQuery.refetch();
    } catch (error: any) {
      toast.error(error.message || "刷新邀请码失败");
    }
  };

  const handleStudentClick = (studentId: number) => {
    navigate({ to: "/classes/$classId/students/$studentId", params: { classId, studentId: studentId.toString() } });
  };

  const handleDeleteStudent = (student: any) => {
    setSelectedStudent(student);
    setShowDeleteConfirm(true);
  };

  const confirmDeleteStudent = async () => {
    if (!selectedStudent || !authToken) return;

    try {
      const result = await trpc.deleteStudentFromClass.mutate({
        authToken,
        studentId: selectedStudent.id,
      });

      if (result.success) {
        toast.success(`学生 ${selectedStudent.name} 已删除${result.inheritanceApplied ? '，学号已自动继承' : ''}`);
        setShowDeleteConfirm(false);
        setSelectedStudent(null);
        // Refresh the students list
        studentsQuery.refetch();
      }
    } catch (error: any) {
      console.error('删除学生失败:', error);
      toast.error(error.message || '删除学生失败，请重试');
    }
  };

  const handleSpecialAttention = async (student: any) => {
    if (!authToken) return;

    try {
      const result = await trpc.toggleSpecialAttention.mutate({
        authToken,
        studentId: student.id,
      });

      if (result.success) {
        const actionText = result.action === 'added' ? '添加' : '取消';
        toast.success(`已${actionText}特别关注: ${student.name}`);
        // Refresh the students list
        studentsQuery.refetch();
      }
    } catch (error: any) {
      console.error('切换特别关注失败:', error);
      toast.error(error.message || '切换特别关注失败，请重试');
    }
  };

  const handleAddToGroup = (student: any) => {
    setSelectedStudentForGroup(student);
    setShowGroupModal(true);
  };

  const handleAssignToGroup = async (studentId: number, groupId: number | null) => {
    if (!authToken) return;

    try {
      const result = await trpc.assignStudentToGroup.mutate({
        authToken,
        studentId,
        groupId,
      });

      if (result.success) {
        const actionText = result.action === 'assigned' ? '分配到小组' : '移出小组';
        const groupText = result.student.group ? result.student.group.name : '无小组';
        toast.success(`学生 ${result.student.name} 已${actionText}: ${groupText}`);
        // Refresh both students and groups data
        studentsQuery.refetch();
        groupsQuery.refetch();
      }
    } catch (error: any) {
      console.error('分配学生到小组失败:', error);
      toast.error(error.message || '分配学生到小组失败，请重试');
    }
  };

  const handleCreateGroup = async (name: string, description?: string, color: string = 'blue') => {
    if (!authToken) return;

    try {
      const result = await trpc.createStudentGroup.mutate({
        authToken,
        classId: parseInt(classId),
        name,
        description,
        color,
      });

      if (result.success) {
        // Refresh groups data
        groupsQuery.refetch();
      }
    } catch (error: any) {
      console.error('创建小组失败:', error);
      toast.error(error.message || '创建小组失败，请重试');
      throw error; // Re-throw to let the modal handle it
    }
  };

  const getContextMenuItems = (student: any): ContextMenuItem[] => [
    {
      label: '删除学生',
      icon: <Trash2 className="w-4 h-4" />,
      onClick: () => handleDeleteStudent(student),
      className: 'text-red-700 hover:bg-red-50',
    },
    {
      label: student.specialAttention ? '取消特别关注' : '特别关注',
      icon: <Heart className="w-4 h-4" />,
      onClick: () => handleSpecialAttention(student),
      className: 'text-pink-700 hover:bg-pink-50',
    },
    {
      label: '添加到小组',
      icon: <Group className="w-4 h-4" />,
      onClick: () => handleAddToGroup(student),
      className: 'text-blue-700 hover:bg-blue-50',
    },
  ];

  if (!isAuthenticated || !teacher) {
    return null;
  }

  const classData = studentsQuery.data?.class;
  const students = studentsQuery.data?.students || [];

  // 排序处理函数
  const handleSort = (newSortBy: typeof sortBy) => {
    if (sortBy === newSortBy) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(newSortBy);
      setSortOrder('asc');
    }
  };

  // 筛选和排序学生
  const filteredAndSortedStudents = students
    .filter(student =>
      student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (student.email && student.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (student.studentId && student.studentId.toLowerCase().includes(searchTerm.toLowerCase()))
    )
    .sort((a, b) => {
      let comparison = 0;

      switch (sortBy) {
        case 'name':
          // 按姓氏排序（中文姓名）
          comparison = a.name.localeCompare(b.name, 'zh-CN');
          break;
        case 'studentId':
          // 按学号排序（数字优先，然后字符串）
          const aId = a.studentId || '';
          const bId = b.studentId || '';
          const aNum = parseInt(aId);
          const bNum = parseInt(bId);
          if (!isNaN(aNum) && !isNaN(bNum)) {
            comparison = aNum - bNum;
          } else {
            comparison = aId.localeCompare(bId);
          }
          break;
        case 'performance':
          // 按综合成绩排序（作业数 + 考试数）
          const aScore = a._count.assignments + a._count.exams;
          const bScore = b._count.assignments + b._count.exams;
          comparison = aScore - bScore;
          break;
        case 'potential':
          // 预留：按提升潜力排序（暂时按错误数量倒序）
          const aPotential = a._count.mistakes + a._count.examMistakes;
          const bPotential = b._count.mistakes + b._count.examMistakes;
          comparison = bPotential - aPotential; // 错误越多，潜力越大
          break;
        default:
          comparison = 0;
      }

      return sortOrder === 'asc' ? comparison : -comparison;
    });

  const totalAssignments = students.reduce((sum, student) => sum + student._count.assignments, 0);
  const totalExams = students.reduce((sum, student) => sum + student._count.exams, 0);
  const mistakeKnowledgeAreas = new Set();
  students.forEach(student => {
    student.studentKnowledgeAreas?.forEach(ska => {
      if (ska.knowledgeArea) {
        mistakeKnowledgeAreas.add(ska.knowledgeArea.name);
      }
    });
  });
  const mistakeBankProgress = mistakeKnowledgeAreas.size;

  return (
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
              <button
                onClick={() => setShowReportModal(true)}
                className="btn-secondary text-sm px-3 py-2 group"
              >
                <BarChart3 className="w-4 h-4 mr-1" />
                生成报告
              </button>
              <button
                onClick={() => setShowInvitationCode(!showInvitationCode)}
                className="btn-secondary text-sm px-3 py-2 group"
              >
                <Users className="w-4 h-4 mr-1" />
                邀请码
                <ChevronRight className={`w-3 h-3 ml-1 transition-transform ${showInvitationCode ? 'rotate-90' : ''}`} />
              </button>
              <button
                onClick={() => setShowTeachingMaterials(true)}
                className="btn-secondary text-sm px-3 py-2 group"
              >
                <BookOpen className="w-4 h-4 mr-1" />
                资料库
              </button>
              <button
                onClick={() => setShowQuestionGenerator(true)}
                className="btn-secondary text-sm px-3 py-2 group"
              >
                <Brain className="w-4 h-4 mr-1" />
                题目生成
              </button>
              <button
                onClick={() => setShowAssignmentUpload(true)}
                className="btn-secondary text-sm px-3 py-2 group"
              >
                <Upload className="w-4 h-4 mr-1" />
                上传作业
              </button>
              <button
                onClick={() => setShowAddStudentModal(true)}
                className="btn-primary text-sm px-3 py-2 group"
              >
                <UserPlus className="w-4 h-4 mr-1" />
                添加学生
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Invitation Code Section */}
      {showInvitationCode && classData && (
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="card bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200 animate-slide-down">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                  <Users className="w-6 h-6 text-blue-600 mr-3" />
                  <h3 className="text-lg font-bold text-gray-900">学生邀请码</h3>
                </div>
                <button
                  onClick={handleRefreshInvitationCode}
                  disabled={refreshInvitationCodeMutation.isPending}
                  className="btn-secondary text-sm group"
                >
                  {refreshInvitationCodeMutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      刷新中...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 mr-2" />
                      刷新邀请码
                    </>
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
                      onClick={() => copyInvitationCode(classData.invitationCode)}
                      className={`w-full py-2 px-4 rounded-lg font-semibold transition-all ${
                        invitationCodeCopied
                          ? "bg-green-100 text-green-700 border border-green-200"
                          : "bg-blue-100 text-blue-700 border border-blue-200 hover:bg-blue-200"
                      }`}
                    >
                      {invitationCodeCopied ? (
                        <>
                          <Check className="w-4 h-4 mr-2 inline" />
                          已复制！
                        </>
                      ) : (
                        <>
                          <Copy className="w-4 h-4 mr-2 inline" />
                          复制代码
                        </>
                      )}
                    </button>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">过期时间</span>
                    <div className="flex items-center text-sm font-medium text-gray-900">
                      <Clock className="w-4 h-4 mr-1" />
                      {new Date(classData.invitationCodeExpiresAt).toLocaleString('zh-CN')}
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
      )}

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="card-interactive p-6 animate-slide-up">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-gray-600 mb-1">学生数</p>
                <p className="text-3xl font-bold text-gray-900">{students.length}</p>
                <p className="text-xs text-blue-600 mt-1">活跃学习者</p>
              </div>
              <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-glow">
                <Users className="w-7 h-7 text-white" />
              </div>
            </div>
          </div>

          <div className="card-interactive p-6 animate-slide-up">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-gray-600 mb-1">作业总数</p>
                <p className="text-3xl font-bold text-gray-900">{totalAssignments}</p>
                <p className="text-xs text-green-600 mt-1">已提交作业</p>
              </div>
              <div className="w-14 h-14 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center shadow-glow">
                <FileText className="w-7 h-7 text-white" />
              </div>
            </div>
          </div>

          <div className="card-interactive p-6 animate-slide-up">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-gray-600 mb-1">考试总数</p>
                <p className="text-3xl font-bold text-gray-900">{totalExams}</p>
                <p className="text-xs text-purple-600 mt-1">已完成考试</p>
              </div>
              <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl flex items-center justify-center shadow-glow">
                <Award className="w-7 h-7 text-white" />
              </div>
            </div>
          </div>

          <div className="card-interactive p-6 animate-slide-up">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-gray-600 mb-1">班级进度</p>
                <p className="text-3xl font-bold text-gray-900">
                  {progressQuery.data?.aiAnalysis?.progressPercentage ?? 92}%
                </p>
                <p className="text-xs text-green-600 mt-1">
                  {progressQuery.isLoading ? "分析中..." : "AI分析"}
                </p>
              </div>
              <div className="w-14 h-14 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center shadow-glow">
                <TrendingUp className="w-7 h-7 text-white" />
              </div>
            </div>
          </div>
        </div>

        {/* Class Performance Trends */}
        <div className="mb-8">
          <div className="card animate-slide-up">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-gray-900">班级表现趋势</h3>
                <Suspense fallback={<div className="text-sm text-gray-500">加载中...</div>}>
                  <TimeRangeSelector
                    value={timeRange}
                    onChange={setTimeRange}
                  />
                </Suspense>
              </div>
            </div>
            <div className="p-6">
              <Suspense fallback={<div className="flex items-center justify-center h-96"><Loader2 className="w-8 h-8 animate-spin text-blue-600" /></div>}>
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
            <div className="card animate-slide-up">
              <div className="p-6 border-b border-gray-200">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
                  <div className="flex items-center">
                    <Users className="w-6 h-6 text-blue-600 mr-3" />
                    <h3 className="text-lg font-bold text-gray-900">班级学生</h3>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <input
                        type="text"
                        placeholder="搜索学生..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-9 pr-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm transition-all"
                      />
                    </div>

                    {/* 排序按钮 */}
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-gray-500">排序:</span>
                      <button
                        onClick={() => handleSort('name')}
                        className={`flex items-center px-3 py-2 text-sm rounded-lg transition-all ${
                          sortBy === 'name'
                            ? 'bg-blue-100 text-blue-700 border border-blue-200'
                            : 'text-gray-600 hover:bg-gray-100'
                        }`}
                      >
                        姓名
                        {sortBy === 'name' && (sortOrder === 'asc' ? <ArrowUp className="w-3 h-3 ml-1" /> : <ArrowDown className="w-3 h-3 ml-1" />)}
                      </button>
                      <button
                        onClick={() => handleSort('studentId')}
                        className={`flex items-center px-3 py-2 text-sm rounded-lg transition-all ${
                          sortBy === 'studentId'
                            ? 'bg-blue-100 text-blue-700 border border-blue-200'
                            : 'text-gray-600 hover:bg-gray-100'
                        }`}
                      >
                        学号
                        {sortBy === 'studentId' && (sortOrder === 'asc' ? <ArrowUp className="w-3 h-3 ml-1" /> : <ArrowDown className="w-3 h-3 ml-1" />)}
                      </button>
                      <button
                        onClick={() => handleSort('performance')}
                        className={`flex items-center px-3 py-2 text-sm rounded-lg transition-all ${
                          sortBy === 'performance'
                            ? 'bg-blue-100 text-blue-700 border border-blue-200'
                            : 'text-gray-600 hover:bg-gray-100'
                        }`}
                      >
                        综合
                        {sortBy === 'performance' && (sortOrder === 'asc' ? <ArrowUp className="w-3 h-3 ml-1" /> : <ArrowDown className="w-3 h-3 ml-1" />)}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-6">
                {filteredAndSortedStudents.length > 0 ? (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {filteredAndSortedStudents.map((student, index) => (
                      <RightClickMenu
                        key={student.id}
                        items={getContextMenuItems(student)}
                      >
                        <div
                          onClick={() => handleStudentClick(student.id)}
                          className="card-interactive p-4 border-0 bg-gradient-to-r from-gray-50 to-blue-50/30 hover:from-blue-50 hover:to-indigo-50 animate-slide-up cursor-pointer group"
                        >
                          {/* 学生基本信息行 */}
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center space-x-3">
                              <div className="relative">
                                <div className="w-10 h-10 bg-gradient-primary rounded-full flex items-center justify-center shadow-glow group-hover:scale-110 transition-transform">
                                  <span className="text-white font-bold text-sm">
                                    {student.name.charAt(0).toUpperCase()}
                                  </span>
                                </div>
                                {student.specialAttention && (
                                  <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center">
                                    <Heart className="w-2 h-2 text-white fill-white" />
                                  </div>
                                )}
                              </div>
                              <div>
                                <h4 className="font-bold text-gray-900 group-hover:text-blue-700 transition-colors text-sm">{student.name}</h4>
                                <div className="flex items-center space-x-2 mt-1">
                                  {student.studentId && (
                                    <div className="flex items-center text-xs text-gray-500">
                                      <GraduationCap className="w-3 h-3 mr-1" />
                                      学号: {student.studentId}
                                    </div>
                                  )}
                                  {student.group && (
                                    <div className="flex items-center text-xs text-blue-600">
                                      <Group className="w-3 h-3 mr-1" />
                                      {student.group.name}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                            <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-blue-600 group-hover:translate-x-1 transition-all" />
                          </div>

                          {/* 统计数据行 */}
                          <div className="flex items-center justify-between text-xs">
                            <div className="flex items-center space-x-4">
                              <div className="text-center">
                                <div className="text-sm font-bold text-blue-600">
                                  {student._count.assignments}
                                </div>
                                <div className="text-xs text-gray-500">作业</div>
                              </div>
                              <div className="text-center">
                                <div className="text-sm font-bold text-purple-600">
                                  {student._count.exams}
                                </div>
                                <div className="text-xs text-gray-500">考试</div>
                              </div>
                              <div className="text-center">
                                <div className="text-sm font-bold text-orange-600">
                                  {student._count.mistakes + student._count.examMistakes}
                                </div>
                                <div className="text-xs text-gray-500">错题</div>
                              </div>
                            </div>
                            {student.email && (
                              <div className="flex items-center text-gray-500 text-xs">
                                <Mail className="w-3 h-3 mr-1" />
                                <span className="truncate max-w-20">{student.email}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </RightClickMenu>
                    ))}
                  </div>
                ) : students.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="w-20 h-20 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-3xl flex items-center justify-center mx-auto mb-6">
                      <Users className="w-10 h-10 text-blue-600" />
                    </div>
                    <h4 className="text-xl font-bold text-gray-900 mb-2">还没有学生</h4>
                    <p className="text-gray-500 mb-8 max-w-sm mx-auto">
                      添加您的第一个学生，开始班级管理和进度跟踪
                    </p>
                    <button
                      onClick={() => setShowAddStudentModal(true)}
                      className="btn-primary text-lg px-8 py-4 group"
                    >
                      <UserPlus className="w-5 h-5 mr-2" />
                      添加学生
                      <Sparkles className="w-5 h-5 ml-2 group-hover:rotate-12 transition-transform" />
                    </button>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Search className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-gray-500">没有找到匹配"{searchTerm}"的学生</p>
                    <button
                      onClick={() => setSearchTerm("")}
                      className="text-blue-600 hover:text-blue-500 text-sm mt-2 font-medium"
                    >
                      清除搜索
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Class Info */}
          <div className="space-y-6">
            {/* AI Progress Insights */}
            <Suspense fallback={<div className="card p-6"><div className="animate-pulse h-32 bg-gray-200 rounded"></div></div>}>
              <ProgressInsightPanel
                aiAnalysis={progressQuery.data?.aiAnalysis}
                isLoading={progressQuery.isLoading}
              />
            </Suspense>

            <div className="card animate-slide-up">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center">
                  <BookOpen className="w-6 h-6 text-blue-600 mr-3" />
                  <h3 className="text-lg font-bold text-gray-900">班级详情</h3>
                </div>
              </div>

              <div className="p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">教师</span>
                  <span className="text-sm font-medium text-gray-900">{teacher.name}</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">创建时间</span>
                  <div className="flex items-center text-sm font-medium text-gray-900">
                    <Calendar className="w-4 h-4 mr-1" />
                    {classData ? new Date(classData.createdAt).toLocaleDateString() : "-"}
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">状态</span>
                  <div className="inline-flex items-center px-2 py-1 rounded-full bg-green-100 text-green-800 text-xs font-semibold">
                    <div className="w-2 h-2 bg-green-500 rounded-full mr-1"></div>
                    活跃
                  </div>
                </div>

                <div className="pt-4 border-t border-gray-200">
                  <button
                    onClick={() => setShowArchiveModal(true)}
                    className="w-full btn-secondary text-sm group flex items-center justify-center"
                  >
                    <Archive className="w-4 h-4 mr-2" />
                    归档班级
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Add Student Modal */}
      <AddStudentModal
        isOpen={showAddStudentModal}
        onClose={() => setShowAddStudentModal(false)}
        classId={parseInt(classId)}
        onSuccess={() => {
          studentsQuery.refetch();
          toast.success("学生添加成功！");
        }}
      />

      {/* Report Generation Modal */}
      <ReportGenerationModal
        isOpen={showReportModal}
        onClose={() => setShowReportModal(false)}
        classId={parseInt(classId)}
        className={classData?.name || ""}
      />

      {/* Archive Class Modal */}
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

      {/* Assignment Upload Modal */}
      <EnhancedTeacherAssignmentUpload
        isOpen={showAssignmentUpload}
        onClose={() => setShowAssignmentUpload(false)}
        classId={parseInt(classId)}
        students={students.map(s => ({ id: s.id, name: s.name }))}
        onSuccess={(uploadedCount) => {
          toast.success(`成功上传 ${uploadedCount} 个作业！`);
          setShowAssignmentUpload(false);
          studentsQuery.refetch();
        }}
      />

      {/* Teaching Materials Library */}
      {showTeachingMaterials && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-hidden">
            <TeachingMaterialLibrary
              onClose={() => setShowTeachingMaterials(false)}
            />
          </div>
        </div>
      )}

      {/* Targeted Question Generator */}
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
      <Transition appear show={showDeleteConfirm} as={Fragment}>
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="min-h-screen px-4 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0"
              enterTo="opacity-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100"
              leaveTo="opacity-0"
            >
              <div className="fixed inset-0 bg-black bg-opacity-50" onClick={() => setShowDeleteConfirm(false)} />
            </Transition.Child>

            <span className="inline-block h-screen align-middle" aria-hidden="true">&#8203;</span>

            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <div className="inline-block w-full max-w-md p-6 my-8 overflow-hidden text-left align-middle transition-all transform bg-white shadow-xl rounded-2xl">
                <div className="flex items-center mb-4">
                  <div className="flex-shrink-0 w-10 h-10 mx-auto flex items-center justify-center rounded-full bg-red-100">
                    <Trash2 className="w-5 h-5 text-red-600" />
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-bold text-gray-900">
                      确认删除学生
                    </h3>
                  </div>
                </div>

                <div className="mb-6">
                  <p className="text-gray-600">
                    您确定要删除学生 <span className="font-semibold text-gray-900">{selectedStudent?.name}</span> 吗？
                  </p>
                  <p className="text-sm text-red-600 mt-2">
                    此操作将永久删除该学生的所有数据，包括作业、考试记录等，且无法恢复。
                  </p>
                </div>

                <div className="flex space-x-3">
                  <button
                    type="button"
                    className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-800 font-medium py-2 px-4 rounded-xl transition-colors"
                    onClick={() => setShowDeleteConfirm(false)}
                  >
                    取消
                  </button>
                  <button
                    type="button"
                    className="flex-1 bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded-xl transition-colors"
                    onClick={confirmDeleteStudent}
                  >
                    确认删除
                  </button>
                </div>
              </div>
            </Transition.Child>
          </div>
        </div>
      </Transition>

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
  );
}
