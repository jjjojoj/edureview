import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTRPC } from "~/trpc/react";
import { useAuthStore } from "~/stores/authStore";
import { PerformanceChart } from "~/components/PerformanceChart";
import { KnowledgeAreaChart } from "~/components/KnowledgeAreaChart";
import { TimeRangeSelector } from "~/components/TimeRangeSelector";
import { 
  ArrowLeft,
  User, 
  BookOpen, 
  FileText, 
  Mail,
  Calendar,
  TrendingUp,
  BarChart3,
  Target,
  Award,
  Clock,
  ChevronRight,
  GraduationCap,
  Star,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Brain,
  Activity,
  PieChart,
  LineChart
} from "lucide-react";

export const Route = createFileRoute("/classes/$classId/students/$studentId/")({
  component: StudentProfile,
});

function StudentProfile() {
  const navigate = useNavigate();
  const { classId, studentId } = Route.useParams();
  const { authToken, teacher, isAuthenticated } = useAuthStore();
  const trpc = useTRPC();
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d' | '1y' | 'all'>('30d');

  useEffect(() => {
    if (!isAuthenticated || !authToken) {
      navigate({ to: "/auth" });
    }
  }, [isAuthenticated, authToken, navigate]);

  const studentQuery = useQuery({
    ...trpc.getStudentProfileData.queryOptions({ 
      authToken: authToken || "", 
      studentId: parseInt(studentId) 
    }),
    enabled: !!authToken && !!studentId,
  });

  const performanceTrendsQuery = useQuery({
    ...trpc.getStudentPerformanceTrends.queryOptions({ 
      authToken: authToken || "", 
      studentId: parseInt(studentId),
      timeRange: timeRange
    }),
    enabled: !!authToken && !!studentId,
  });

  if (!isAuthenticated || !teacher) {
    return null;
  }

  const studentData = studentQuery.data?.student;
  const statistics = studentQuery.data?.statistics;

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
                onClick={() => navigate({ to: "/classes/$classId", params: { classId } })}
                className="p-2 text-gray-400 hover:text-gray-600 rounded-xl hover:bg-gray-100 transition-all"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div className="flex items-center">
                <div className="w-10 h-10 bg-gradient-primary rounded-xl flex items-center justify-center mr-3 shadow-glow">
                  <User className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-gray-900">
                    {studentData?.name || "加载中..."}
                  </h1>
                  <p className="text-sm text-gray-500">学生档案</p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <div className="text-right">
                <p className="text-sm font-semibold text-gray-900">{teacher.name}</p>
                <p className="text-xs text-gray-500">班主任</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {studentQuery.isLoading ? (
          <div className="space-y-6">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="animate-pulse">
                <div className="card p-6">
                  <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
                  <div className="space-y-3">
                    <div className="h-3 bg-gray-200 rounded"></div>
                    <div className="h-3 bg-gray-200 rounded w-5/6"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : studentData ? (
          <>
            {/* Student Overview Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <div className="card-interactive p-6 animate-slide-up">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-gray-600 mb-1">作业数量</p>
                    <p className="text-3xl font-bold text-gray-900">{statistics?.totalAssignments || 0}</p>
                    <p className="text-xs text-blue-600 mt-1">已完成</p>
                  </div>
                  <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-glow">
                    <FileText className="w-7 h-7 text-white" />
                  </div>
                </div>
              </div>

              <div className="card-interactive p-6 animate-slide-up" style={{ animationDelay: '0.1s' }}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-gray-600 mb-1">考试数量</p>
                    <p className="text-3xl font-bold text-gray-900">{statistics?.totalExams || 0}</p>
                    <p className="text-xs text-purple-600 mt-1">已参加</p>
                  </div>
                  <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl flex items-center justify-center shadow-glow">
                    <Award className="w-7 h-7 text-white" />
                  </div>
                </div>
              </div>

              <div className="card-interactive p-6 animate-slide-up" style={{ animationDelay: '0.2s' }}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-gray-600 mb-1">错误总数</p>
                    <p className="text-3xl font-bold text-gray-900">{statistics?.totalMistakes || 0}</p>
                    <p className="text-xs text-orange-600 mt-1">需要改进</p>
                  </div>
                  <div className="w-14 h-14 bg-gradient-to-br from-orange-500 to-red-600 rounded-2xl flex items-center justify-center shadow-glow">
                    <AlertTriangle className="w-7 h-7 text-white" />
                  </div>
                </div>
              </div>

              <div className="card-interactive p-6 animate-slide-up" style={{ animationDelay: '0.3s' }}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-gray-600 mb-1">平均熟练度</p>
                    <p className="text-3xl font-bold text-gray-900">
                      {statistics?.averageProficiency ? (statistics.averageProficiency * 33.33).toFixed(0) : 0}%
                    </p>
                    <p className="text-xs text-green-600 mt-1">整体水平</p>
                  </div>
                  <div className="w-14 h-14 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center shadow-glow">
                    <TrendingUp className="w-7 h-7 text-white" />
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Main Content */}
              <div className="lg:col-span-2 space-y-8">
                {/* Performance Charts */}
                <div className="card animate-slide-up" style={{ animationDelay: '0.4s' }}>
                  <div className="p-6 border-b border-gray-200">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <LineChart className="w-6 h-6 text-blue-600 mr-3" />
                        <h3 className="text-lg font-bold text-gray-900">学习趋势分析</h3>
                      </div>
                      <TimeRangeSelector
                        value={timeRange}
                        onChange={setTimeRange}
                      />
                    </div>
                  </div>
                  <div className="p-6">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      <PerformanceChart
                        data={performanceTrendsQuery.data?.performanceTrends || []}
                        title="成绩趋势"
                        height={300}
                      />
                      <KnowledgeAreaChart
                        data={performanceTrendsQuery.data?.proficiencyTrends || []}
                        height={300}
                      />
                    </div>
                    
                    {/* Performance Summary */}
                    {performanceTrendsQuery.data?.summary && (
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-6 border-t border-gray-200">
                        <div className="text-center">
                          <div className="text-xl font-bold text-blue-600">
                            {performanceTrendsQuery.data.summary.averageAssignmentScore.toFixed(1)}
                          </div>
                          <div className="text-sm text-gray-600">平均作业分</div>
                        </div>
                        <div className="text-center">
                          <div className="text-xl font-bold text-purple-600">
                            {performanceTrendsQuery.data.summary.averageExamScore.toFixed(1)}
                          </div>
                          <div className="text-sm text-gray-600">平均考试分</div>
                        </div>
                        <div className="text-center">
                          <div className="text-xl font-bold text-green-600">
                            {performanceTrendsQuery.data.summary.totalAssignments}
                          </div>
                          <div className="text-sm text-gray-600">完成作业</div>
                        </div>
                        <div className="text-center">
                          <div className="text-xl font-bold text-orange-600">
                            {performanceTrendsQuery.data.summary.totalMistakes}
                          </div>
                          <div className="text-sm text-gray-600">总错误数</div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Recent Assignments */}
                <div className="card animate-slide-up" style={{ animationDelay: '0.5s' }}>
                  <div className="p-6 border-b border-gray-200">
                    <div className="flex items-center">
                      <FileText className="w-6 h-6 text-blue-600 mr-3" />
                      <h3 className="text-lg font-bold text-gray-900">最近作业</h3>
                    </div>
                  </div>
                  <div className="p-6">
                    {studentData.assignments.length > 0 ? (
                      <div className="space-y-4">
                        {studentData.assignments.slice(0, 5).map((assignment, index) => (
                          <div key={assignment.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-blue-50 transition-colors">
                            <div className="flex items-center space-x-4">
                              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                                <FileText className="w-5 h-5 text-blue-600" />
                              </div>
                              <div>
                                <h4 className="font-semibold text-gray-900">{assignment.title}</h4>
                                <p className="text-sm text-gray-500">
                                  {new Date(assignment.createdAt).toLocaleDateString('zh-CN')}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center space-x-2">
                              {assignment.analysis ? (
                                <div className="flex items-center space-x-2">
                                  <CheckCircle className="w-5 h-5 text-green-500" />
                                  <span className="text-sm text-green-600">已分析</span>
                                </div>
                              ) : (
                                <div className="flex items-center space-x-2">
                                  <Clock className="w-5 h-5 text-orange-500" />
                                  <span className="text-sm text-orange-600">待分析</span>
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-500">暂无作业记录</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Recent Exams */}
                <div className="card animate-slide-up" style={{ animationDelay: '0.6s' }}>
                  <div className="p-6 border-b border-gray-200">
                    <div className="flex items-center">
                      <Award className="w-6 h-6 text-purple-600 mr-3" />
                      <h3 className="text-lg font-bold text-gray-900">最近考试</h3>
                    </div>
                  </div>
                  <div className="p-6">
                    {studentData.exams.length > 0 ? (
                      <div className="space-y-4">
                        {studentData.exams.slice(0, 5).map((exam, index) => (
                          <div key={exam.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-purple-50 transition-colors">
                            <div className="flex items-center space-x-4">
                              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                                <Award className="w-5 h-5 text-purple-600" />
                              </div>
                              <div>
                                <h4 className="font-semibold text-gray-900">{exam.title}</h4>
                                <p className="text-sm text-gray-500">
                                  {new Date(exam.createdAt).toLocaleDateString('zh-CN')}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center space-x-2">
                              {exam.analysis ? (
                                <div className="flex items-center space-x-2">
                                  <CheckCircle className="w-5 h-5 text-green-500" />
                                  <span className="text-sm text-green-600">已分析</span>
                                </div>
                              ) : (
                                <div className="flex items-center space-x-2">
                                  <Clock className="w-5 h-5 text-orange-500" />
                                  <span className="text-sm text-orange-600">待分析</span>
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <Award className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-500">暂无考试记录</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Sidebar */}
              <div className="space-y-6">
                {/* Student Info */}
                <div className="card animate-slide-up" style={{ animationDelay: '0.7s' }}>
                  <div className="p-6 border-b border-gray-200">
                    <div className="flex items-center">
                      <User className="w-6 h-6 text-blue-600 mr-3" />
                      <h3 className="text-lg font-bold text-gray-900">学生信息</h3>
                    </div>
                  </div>
                  <div className="p-6 space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">姓名</span>
                      <span className="text-sm font-medium text-gray-900">{studentData.name}</span>
                    </div>
                    {studentData.studentId && (
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">学号</span>
                        <span className="text-sm font-medium text-gray-900">{studentData.studentId}</span>
                      </div>
                    )}
                    {studentData.email && (
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">邮箱</span>
                        <span className="text-sm font-medium text-gray-900">{studentData.email}</span>
                      </div>
                    )}
                    {studentData.grade && (
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">年级</span>
                        <span className="text-sm font-medium text-gray-900">{studentData.grade}</span>
                      </div>
                    )}
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">班级</span>
                      <span className="text-sm font-medium text-gray-900">{studentData.class?.name}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">加入时间</span>
                      <span className="text-sm font-medium text-gray-900">
                        {new Date(studentData.createdAt).toLocaleDateString('zh-CN')}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Mistake Analysis */}
                <div className="card animate-slide-up" style={{ animationDelay: '0.8s' }}>
                  <div className="p-6 border-b border-gray-200">
                    <div className="flex items-center">
                      <Target className="w-6 h-6 text-orange-600 mr-3" />
                      <h3 className="text-lg font-bold text-gray-900">错题分析</h3>
                    </div>
                  </div>
                  <div className="p-6">
                    {statistics?.mistakesByKnowledgeArea && statistics.mistakesByKnowledgeArea.length > 0 ? (
                      <div className="space-y-4">
                        {statistics.mistakesByKnowledgeArea.slice(0, 5).map((area, index) => (
                          <div key={area.name} className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
                                <Brain className="w-4 h-4 text-orange-600" />
                              </div>
                              <span className="text-sm font-medium text-gray-900">{area.name}</span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <div className="text-sm font-bold text-orange-600">{area.count}</div>
                              <div className="text-xs text-gray-500">次</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <Target className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-500">暂无错题记录</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Knowledge Areas */}
                <div className="card animate-slide-up" style={{ animationDelay: '0.9s' }}>
                  <div className="p-6 border-b border-gray-200">
                    <div className="flex items-center">
                      <Brain className="w-6 h-6 text-green-600 mr-3" />
                      <h3 className="text-lg font-bold text-gray-900">知识掌握</h3>
                    </div>
                  </div>
                  <div className="p-6">
                    {studentData.studentKnowledgeAreas.length > 0 ? (
                      <div className="space-y-4">
                        {studentData.studentKnowledgeAreas.map((ska, index) => (
                          <div key={ska.id} className="flex items-center justify-between">
                            <span className="text-sm font-medium text-gray-900">{ska.knowledgeArea.name}</span>
                            <div className="flex items-center space-x-2">
                              <div className={`px-2 py-1 rounded-full text-xs font-semibold ${
                                ska.proficiencyLevel === 'advanced' ? 'bg-green-100 text-green-800' :
                                ska.proficiencyLevel === 'intermediate' ? 'bg-yellow-100 text-yellow-800' :
                                'bg-red-100 text-red-800'
                              }`}>
                                {ska.proficiencyLevel === 'advanced' ? '熟练' :
                                 ska.proficiencyLevel === 'intermediate' ? '中等' : '初级'}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <Brain className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-500">暂无知识点记录</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="text-center py-12">
            <User className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-gray-900 mb-2">学生不存在</h3>
            <p className="text-gray-500 mb-8">找不到该学生的信息</p>
            <button 
              onClick={() => navigate({ to: "/classes/$classId", params: { classId } })}
              className="btn-primary"
            >
              返回班级页面
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
