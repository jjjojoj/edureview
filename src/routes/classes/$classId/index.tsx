import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, Fragment } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useTRPC } from "~/trpc/react";
import { useAuthStore } from "~/stores/authStore";
import { AddStudentModal } from "~/components/AddStudentModal";
import { EnhancedTeacherAssignmentUpload } from "~/components/EnhancedTeacherAssignmentUpload";
import { ProgressInsightPanel } from "~/components/ProgressInsightPanel";
import { ClassPerformanceChart } from "~/components/ClassPerformanceChart";
import { TimeRangeSelector } from "~/components/TimeRangeSelector";
import { ReportGenerationModal } from "~/components/ReportGenerationModal";
import { ArchiveClassModal } from "~/components/ArchiveClassModal";
import { TeachingMaterialLibrary } from "~/components/TeachingMaterialLibrary";
import { TargetedQuestionGenerator } from "~/components/TargetedQuestionGenerator";
import { Menu, Transition } from "@headlessui/react";
import { 
  ArrowLeft,
  Plus, 
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
} from "lucide-react";
import toast from "react-hot-toast";

export const Route = createFileRoute("/classes/$classId/")({
  component: ClassDetail,
});

function ClassDetail() {
  const navigate = useNavigate();
  const { classId } = Route.useParams();
  const { authToken, teacher, isAuthenticated } = useAuthStore();
  const [searchTerm, setSearchTerm] = useState("");
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
      studentsQuery.refetch(); // Refresh to get new invitation code
    } catch (error: any) {
      toast.error(error.message || "刷新邀请码失败");
    }
  };

  const handleStudentClick = (studentId: number) => {
    navigate({ to: "/classes/$classId/students/$studentId", params: { classId, studentId: studentId.toString() } });
  };

  if (!isAuthenticated || !teacher) {
    return null;
  }

  const classData = studentsQuery.data?.class;
  const students = studentsQuery.data?.students || [];
  
  const filteredStudents = students.filter(student =>
    student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (student.email && student.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (student.studentId && student.studentId.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const totalAssignments = students.reduce((sum, student) => sum + student._count.assignments, 0);
  const totalExams = students.reduce((sum, student) => sum + student._count.exams, 0);
  const totalMistakes = students.reduce((sum, student) => sum + student._count.mistakes + student._count.examMistakes, 0);
  const averageAssignments = students.length > 0 ? (totalAssignments / students.length).toFixed(1) : "0";
  
  // Calculate mistake bank progress - unique knowledge areas with mistakes
  const mistakeKnowledgeAreas = new Set();
  students.forEach(student => {
    student.studentKnowledgeAreas?.forEach(ska => {
      if (ska.knowledgeArea) {
        mistakeKnowledgeAreas.add(ska.knowledgeArea.name);
      }
    });
  });
  const mistakeBankProgress = mistakeKnowledgeAreas.size;

  const handleAddStudentSuccess = () => {
    studentsQuery.refetch();
    toast.success("学生添加成功！");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-indigo-50/30">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
      
      {/* Header */}
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
                生成练习题
              </button>
              <button 
                onClick={() => setShowAssignmentUpload(true)}
                className="btn-secondary text-sm px-3 py-2 group"
              >
                <Upload className="w-4 h-4 mr-1" />
                上传作业
              </button>
              <button 
                onClick={() => setShowExamUpload(true)}
                className="btn-secondary text-sm px-3 py-2 group"
              >
                <Upload className="w-4 h-4 mr-1" />
                上传考试
              </button>
              <button 
                onClick={() => setShowAddStudentModal(true)}
                className="btn-primary text-sm px-3 py-2 group"
              >
                <UserPlus className="w-4 h-4 mr-1" />
                添加学生
              </button>
              <div className="relative">
                <Menu as="div" className="relative inline-block text-left">
                  <div>
                    <Menu.Button className="btn-secondary text-sm px-3 py-2 group">
                      <MoreVertical className="w-4 h-4" />
                    </Menu.Button>
                  </div>
                  <Transition
                    as={Fragment}
                    enter="transition ease-out duration-100"
                    enterFrom="transform opacity-0 scale-95"
                    enterTo="transform opacity-100 scale-100"
                    leave="transition ease-in duration-75"
                    leaveFrom="transform opacity-100 scale-100"
                    leaveTo="transform opacity-0 scale-95"
                  >
                    <Menu.Items className="absolute right-0 mt-2 w-56 origin-top-right divide-y divide-gray-100 rounded-xl bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none z-10">
                      <div className="px-1 py-1">
                        <Menu.Item>
                          {({ active }) => (
                            <button
                              onClick={() => setShowArchiveModal(true)}
                              className={`${
                                active ? 'bg-orange-50 text-orange-600' : 'text-gray-700'
                              } group flex w-full items-center rounded-lg px-3 py-2 text-sm font-medium transition-all`}
                            >
                              <Archive className="w-4 h-4 mr-3" />
                              结束学年
                            </button>
                          )}
                        </Menu.Item>
                      </div>
                    </Menu.Items>
                  </Transition>
                </Menu>
              </div>
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
                  
                  <div className="text-xs text-gray-500 bg-gray-100 rounded-lg p-3">
                    <p className="mb-1">• 邀请码有效期为24小时</p>
                    <p className="mb-1">• 每24小时只能刷新一次</p>
                    <p>• 学生使用此码即可加入班级</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
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

          <div className="card-interactive p-6 animate-slide-up" style={{ animationDelay: '0.1s' }}>
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

          <div className="card-interactive p-6 animate-slide-up" style={{ animationDelay: '0.2s' }}>
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

          <div className="card-interactive p-6 animate-slide-up" style={{ animationDelay: '0.3s' }}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-gray-600 mb-1">错题库</p>
                <p className="text-3xl font-bold text-gray-900">{mistakeBankProgress}</p>
                <p className="text-xs text-orange-600 mt-1">知识领域</p>
              </div>
              <div className="w-14 h-14 bg-gradient-to-br from-orange-500 to-red-600 rounded-2xl flex items-center justify-center shadow-glow">
                <Target className="w-7 h-7 text-white" />
              </div>
            </div>
          </div>

          <div className="card-interactive p-6 animate-slide-up" style={{ animationDelay: '0.4s' }}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-gray-600 mb-1">班级进度</p>
                <p className="text-3xl font-bold text-gray-900">
                  {progressQuery.data?.aiAnalysis.progressPercentage ?? 92}%
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
                <TimeRangeSelector
                  value={timeRange}
                  onChange={setTimeRange}
                />
              </div>
            </div>
            <div className="p-6">
              <ClassPerformanceChart
                data={{
                  performanceTrends: classPerformanceTrendsQuery.data?.performanceTrends || [],
                  participationTrends: classPerformanceTrendsQuery.data?.participationTrends || [],
                  mistakeTrends: classPerformanceTrendsQuery.data?.mistakeTrends || [],
                }}
                height={400}
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Students Section */}
          <div className="lg:col-span-3">
            <div className="card animate-slide-up" style={{ animationDelay: '0.4s' }}>
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
                  </div>
                </div>
              </div>

              <div className="p-6">
                {studentsQuery.isLoading ? (
                  <div className="space-y-4">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <div key={i} className="animate-pulse flex items-center space-x-4 p-4">
                        <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
                        <div className="flex-1 space-y-2">
                          <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                          <div className="h-3 bg-gray-200 rounded w-1/3"></div>
                        </div>
                        <div className="w-20 h-8 bg-gray-200 rounded"></div>
                      </div>
                    ))}
                  </div>
                ) : filteredStudents.length > 0 ? (
                  <div className="space-y-4">
                    {filteredStudents.map((student, index) => (
                      <div 
                        key={student.id} 
                        onClick={() => handleStudentClick(student.id)}
                        className="card-interactive p-4 border-0 bg-gradient-to-r from-gray-50 to-blue-50/30 hover:from-blue-50 hover:to-indigo-50 animate-slide-up cursor-pointer group"
                        style={{ animationDelay: `${0.5 + index * 0.05}s` }}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4">
                            <div className="w-12 h-12 bg-gradient-primary rounded-full flex items-center justify-center shadow-glow group-hover:scale-110 transition-transform">
                              <span className="text-white font-bold text-lg">
                                {student.name.charAt(0).toUpperCase()}
                              </span>
                            </div>
                            <div>
                              <h4 className="font-bold text-gray-900 group-hover:text-blue-700 transition-colors">{student.name}</h4>
                              <div className="flex items-center space-x-4 text-sm text-gray-500 mt-1">
                                {student.studentId && (
                                  <div className="flex items-center">
                                    <GraduationCap className="w-3 h-3 mr-1" />
                                    学号: {student.studentId}
                                  </div>
                                )}
                                {student.email && (
                                  <div className="flex items-center">
                                    <Mail className="w-3 h-3 mr-1" />
                                    {student.email}
                                  </div>
                                )}
                                {student.grade && (
                                  <div className="flex items-center">
                                    <Star className="w-3 h-3 mr-1" />
                                    年级 {student.grade}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex items-center space-x-6">
                            <div className="text-center">
                              <div className="text-lg font-bold text-blue-600">
                                {student._count.assignments}
                              </div>
                              <div className="text-xs text-gray-500">作业数</div>
                            </div>
                            <div className="text-center">
                              <div className="text-lg font-bold text-purple-600">
                                {student._count.exams}
                              </div>
                              <div className="text-xs text-gray-500">考试数</div>
                            </div>
                            <div className="text-center">
                              <div className="text-lg font-bold text-orange-600">
                                {student._count.mistakes + student._count.examMistakes}
                              </div>
                              <div className="text-xs text-gray-500">错误数</div>
                            </div>
                            <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-blue-600 group-hover:translate-x-1 transition-all" />
                          </div>
                        </div>
                      </div>
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
                      添加您的第一个学生
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

          {/* Class Info & Actions */}
          <div className="space-y-6">
            {/* AI Progress Insights */}
            <ProgressInsightPanel
              aiAnalysis={progressQuery.data?.aiAnalysis}
              isLoading={progressQuery.isLoading}
            />

            {/* Class Information */}
            <div className="card animate-slide-up" style={{ animationDelay: '0.7s' }}>
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
                  <span className="text-sm text-gray-600">科目</span>
                  <span className="text-sm font-medium text-gray-900">
                    {classData?.name.includes('数学') ? '数学' : 
                     classData?.name.includes('语文') ? '语文' : 
                     classData?.name.includes('英语') ? '英语' : 
                     classData?.name.includes('物理') ? '物理' : 
                     classData?.name.includes('化学') ? '化学' : '综合'}
                  </span>
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
              </div>
            </div>

            {/* Quick Stats */}
            <div className="card bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200 animate-slide-up" style={{ animationDelay: '0.8s' }}>
              <div className="p-6 text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-glow">
                  <Award className="w-8 h-8 text-white" />
                </div>
                <h3 className="font-bold text-gray-900 mb-2">班级表现</h3>
                <p className="text-sm text-gray-600 mb-4">
                  您的学生表现出色！继续保持优秀的教学。
                </p>
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center">
                    <div className="text-xl font-bold text-purple-600">92%</div>
                    <div className="text-xs text-gray-500">平均分</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xl font-bold text-pink-600">8.7</div>
                    <div className="text-xs text-gray-500">参与度</div>
                  </div>
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
        onSuccess={handleAddStudentSuccess}
      />

      {/* Assignment Upload Modal */}
      {showAssignmentUpload && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-6xl max-h-[90vh] overflow-y-auto">
            <EnhancedTeacherAssignmentUpload
              classId={parseInt(classId)}
              students={students.map(s => ({ id: s.id, name: s.name }))}
              onSuccess={(count) => {
                studentsQuery.refetch();
                toast.success(`成功上传 ${count} 个作业！`);
              }}
              onClose={() => setShowAssignmentUpload(false)}
            />
          </div>
        </div>
      )}

      {/* Exam Upload Modal */}
      {showExamUpload && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-6xl max-h-[90vh] overflow-y-auto">
            <EnhancedTeacherAssignmentUpload
              classId={parseInt(classId)}
              students={students.map(s => ({ id: s.id, name: s.name }))}
              onSuccess={(count) => {
                studentsQuery.refetch();
                toast.success(`成功上传 ${count} 个考试！`);
              }}
              onClose={() => setShowExamUpload(false)}
              uploadType="exam"
            />
          </div>
        </div>
      )}

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
    </div>
  );
}
