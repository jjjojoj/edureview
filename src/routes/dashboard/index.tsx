import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTRPC } from "~/trpc/react";
import { useAuthStore } from "~/stores/authStore";
import { CreateClassModal } from "~/components/CreateClassModal";
import { TeachingMaterialLibrary } from "~/components/TeachingMaterialLibrary";
import { TargetedQuestionGenerator } from "~/components/TargetedQuestionGenerator";
import { 
  Plus, 
  Users, 
  BookOpen, 
  TrendingUp, 
  FileText, 
  Clock,
  GraduationCap,
  LogOut,
  Settings,
  ChevronRight,
  Sparkles,
  BarChart3,
  Calendar,
  Award,
  Target,
  Zap,
  Brain
} from "lucide-react";
import toast from "react-hot-toast";

export const Route = createFileRoute("/dashboard/")({
  component: Dashboard,
});

function Dashboard() {
  const navigate = useNavigate();
  const { authToken, teacher, isAuthenticated, logout } = useAuthStore();
  const [isCreateClassModalOpen, setIsCreateClassModalOpen] = useState(false);
  const [showTeachingMaterials, setShowTeachingMaterials] = useState(false);
  const [showQuestionGenerator, setShowQuestionGenerator] = useState(false);
  const trpc = useTRPC();

  useEffect(() => {
    if (!isAuthenticated || !authToken) {
      navigate({ to: "/auth" });
    } else {
      const { userRole } = useAuthStore.getState();
      if (userRole === "parent") {
        navigate({ to: "/parent-dashboard" });
      }
    }
  }, [isAuthenticated, authToken, navigate]);

  const classesQuery = useQuery({
    ...trpc.getTeacherClasses.queryOptions({ authToken: authToken || "" }),
    enabled: !!authToken,
  });

  const handleLogout = () => {
    logout();
    toast.success("已成功退出登录");
    navigate({ to: "/auth" });
  };

  const handleClassClick = (classId: number) => {
    navigate({ to: "/classes/$classId", params: { classId: classId.toString() } });
  };

  if (!isAuthenticated || !teacher) {
    return null;
  }

  // Additional check to ensure only teachers access this dashboard
  const { userRole } = useAuthStore.getState();
  if (userRole !== "teacher") {
    return null;
  }

  const classes = classesQuery.data?.classes || [];
  const totalStudents = classes.reduce((sum, cls) => sum + cls._count.students, 0);
  const totalAssignments = classes.reduce((sum, cls) => sum + cls._count.assignments, 0);
  const totalExams = classes.reduce((sum, cls) => sum + cls._count.exams, 0);
  
  // Calculate mistake bank progress (placeholder - this would need actual mistake data)
  const mistakeBankProgress = totalAssignments > 0 ? Math.round((totalAssignments * 0.85)) : 0; // Placeholder calculation

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-indigo-50/30">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
      
      {/* Header */}
      <header className="relative bg-white/80 backdrop-blur-xl border-b border-gray-200/50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-gradient-primary rounded-xl flex items-center justify-center mr-3 shadow-glow">
                <GraduationCap className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-xl font-bold text-gradient-primary">智学分析</h1>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm font-semibold text-gray-900">{teacher.name}</p>
                <p className="text-xs text-gray-500">教师工作台</p>
              </div>
              <div className="flex items-center space-x-2">
                <button className="p-2 text-gray-400 hover:text-gray-600 rounded-xl hover:bg-gray-100 transition-all">
                  <Settings className="w-5 h-5" />
                </button>
                <button 
                  onClick={handleLogout}
                  className="p-2 text-gray-400 hover:text-red-600 rounded-xl hover:bg-red-50 transition-all"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8 animate-fade-in">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-2">
                欢迎回来，<span className="text-gradient-primary">{teacher.name.split(' ')[0]}</span>！ 
                <Sparkles className="w-8 h-8 inline ml-2 text-yellow-500" />
              </h2>
              <p className="text-gray-600 text-lg">
                这是您今天班级的最新情况。
              </p>
            </div>
            <div className="hidden sm:block">
              <div className="text-right">
                <div className="text-sm text-gray-500 mb-1">今日日期</div>
                <div className="text-lg font-semibold text-gray-900">
                  {new Date().toLocaleDateString('zh-CN', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
          <div className="card-interactive p-6 animate-slide-up">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-gray-600 mb-1">学生总数</p>
                <p className="text-3xl font-bold text-gray-900">{totalStudents}</p>
                <p className="text-xs text-green-600 mt-1">本月 +12%</p>
              </div>
              <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-glow">
                <Users className="w-7 h-7 text-white" />
              </div>
            </div>
          </div>

          <div className="card-interactive p-6 animate-slide-up" style={{ animationDelay: '0.1s' }}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-gray-600 mb-1">班级总数</p>
                <p className="text-3xl font-bold text-gray-900">{classes.length}</p>
                <p className="text-xs text-blue-600 mt-1">全部活跃</p>
              </div>
              <div className="w-14 h-14 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center shadow-glow">
                <BookOpen className="w-7 h-7 text-white" />
              </div>
            </div>
          </div>

          <div className="card-interactive p-6 animate-slide-up" style={{ animationDelay: '0.2s' }}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-gray-600 mb-1">作业数量</p>
                <p className="text-3xl font-bold text-gray-900">{totalAssignments}</p>
                <p className="text-xs text-purple-600 mt-1">本周 +8</p>
              </div>
              <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl flex items-center justify-center shadow-glow">
                <FileText className="w-7 h-7 text-white" />
              </div>
            </div>
          </div>

          <div className="card-interactive p-6 animate-slide-up" style={{ animationDelay: '0.3s' }}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-gray-600 mb-1">考试数量</p>
                <p className="text-3xl font-bold text-gray-900">{totalExams}</p>
                <p className="text-xs text-orange-600 mt-1">已分析</p>
              </div>
              <div className="w-14 h-14 bg-gradient-to-br from-orange-500 to-red-600 rounded-2xl flex items-center justify-center shadow-glow">
                <Award className="w-7 h-7 text-white" />
              </div>
            </div>
          </div>

          <div className="card-interactive p-6 animate-slide-up" style={{ animationDelay: '0.4s' }}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-gray-600 mb-1">错题库进度</p>
                <p className="text-3xl font-bold text-gray-900">{mistakeBankProgress}</p>
                <p className="text-xs text-green-600 mt-1">已收集题目</p>
              </div>
              <div className="w-14 h-14 bg-gradient-to-br from-rose-500 to-pink-600 rounded-2xl flex items-center justify-center shadow-glow">
                <Target className="w-7 h-7 text-white" />
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Classes Section */}
          <div className="lg:col-span-2">
            <div className="card animate-slide-up" style={{ animationDelay: '0.5s' }}>
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <BookOpen className="w-6 h-6 text-blue-600 mr-3" />
                    <h3 className="text-lg font-bold text-gray-900">您的班级</h3>
                  </div>
                  <button 
                    onClick={() => setIsCreateClassModalOpen(true)}
                    className="btn-primary group"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    新建班级
                    <Sparkles className="w-4 h-4 ml-2 group-hover:rotate-12 transition-transform" />
                  </button>
                </div>
              </div>

              <div className="p-6">
                {classesQuery.isLoading ? (
                  <div className="space-y-4">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="animate-pulse">
                        <div className="flex items-center space-x-4 p-4">
                          <div className="w-12 h-12 bg-gray-200 rounded-xl"></div>
                          <div className="flex-1">
                            <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                            <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : classes.length > 0 ? (
                  <div className="space-y-4">
                    {classes.map((cls, index) => (
                      <div 
                        key={cls.id} 
                        onClick={() => handleClassClick(cls.id)}
                        className="card-interactive p-4 border-0 bg-gradient-to-r from-gray-50 to-blue-50/50 hover:from-blue-50 hover:to-indigo-50 cursor-pointer group animate-slide-up"
                        style={{ animationDelay: `${0.6 + index * 0.1}s` }}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center flex-1">
                            <div className="w-12 h-12 bg-gradient-primary rounded-xl flex items-center justify-center mr-4 group-hover:scale-110 transition-transform shadow-glow">
                              <GraduationCap className="w-6 h-6 text-white" />
                            </div>
                            <div className="flex-1">
                              <h4 className="font-bold text-gray-900 group-hover:text-blue-700 transition-colors">{cls.name}</h4>
                              <div className="flex items-center space-x-4 text-sm text-gray-500 mt-1">
                                <div className="flex items-center">
                                  <Users className="w-3 h-3 mr-1" />
                                  {cls._count.students} 名学生
                                  {cls.initialStudentCount && (
                                    <span className="text-blue-600 ml-1">
                                      (预期: {cls.initialStudentCount})
                                    </span>
                                  )}
                                </div>
                                <div className="flex items-center">
                                  <FileText className="w-3 h-3 mr-1" />
                                  {cls._count.assignments} 个作业
                                </div>
                                <div className="flex items-center">
                                  <Clock className="w-3 h-3 mr-1" />
                                  {new Date(cls.createdAt).toLocaleDateString('zh-CN')}
                                </div>
                              </div>
                              {cls.description && (
                                <p className="text-xs text-gray-400 mt-2">{cls.description}</p>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center space-x-3">
                            <div className="text-right">
                              <div className="text-xs text-gray-500 mb-1">完成率</div>
                              <div className="text-sm font-semibold text-green-600">92%</div>
                            </div>
                            <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-blue-600 group-hover:translate-x-1 transition-all" />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <div className="w-20 h-20 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-3xl flex items-center justify-center mx-auto mb-6">
                      <BookOpen className="w-10 h-10 text-blue-600" />
                    </div>
                    <h4 className="text-xl font-bold text-gray-900 mb-2">还没有班级</h4>
                    <p className="text-gray-500 mb-8 max-w-sm mx-auto">
                      创建您的第一个班级，开始管理学生并分析他们的表现
                    </p>
                    <button 
                      onClick={() => setIsCreateClassModalOpen(true)}
                      className="btn-primary text-lg px-8 py-4 group"
                    >
                      <Plus className="w-5 h-5 mr-2" />
                      创建您的第一个班级
                      <Sparkles className="w-5 h-5 ml-2 group-hover:rotate-12 transition-transform" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Quick Actions & Analytics */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <div className="card animate-slide-up" style={{ animationDelay: '0.7s' }}>
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center">
                  <Zap className="w-6 h-6 text-yellow-500 mr-3" />
                  <h3 className="text-lg font-bold text-gray-900">快捷操作</h3>
                </div>
              </div>
              
              <div className="p-6">
                <div className="space-y-4">
                  <button 
                    onClick={() => setShowTeachingMaterials(true)}
                    className="w-full p-4 border-2 border-dashed border-gray-300 rounded-xl hover:border-blue-400 hover:bg-blue-50 transition-all group text-left"
                  >
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-blue-100 group-hover:bg-blue-200 rounded-lg flex items-center justify-center mr-4 transition-colors">
                        <BookOpen className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <div className="font-semibold text-gray-900 group-hover:text-blue-700">教学资料库</div>
                        <div className="text-sm text-gray-500">管理您的知识库材料</div>
                      </div>
                    </div>
                  </button>

                  <button 
                    onClick={() => setShowQuestionGenerator(true)}
                    className="w-full p-4 border-2 border-dashed border-gray-300 rounded-xl hover:border-purple-400 hover:bg-purple-50 transition-all group text-left"
                  >
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-purple-100 group-hover:bg-purple-200 rounded-lg flex items-center justify-center mr-4 transition-colors">
                        <Brain className="w-5 h-5 text-purple-600" />
                      </div>
                      <div>
                        <div className="font-semibold text-gray-900 group-hover:text-purple-700">生成练习题</div>
                        <div className="text-sm text-gray-500">基于错题库智能生成</div>
                      </div>
                    </div>
                  </button>
                  
                  <button className="w-full p-4 border-2 border-dashed border-gray-300 rounded-xl hover:border-green-400 hover:bg-green-50 transition-all group text-left">
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-green-100 group-hover:bg-green-200 rounded-lg flex items-center justify-center mr-4 transition-colors">
                        <BarChart3 className="w-5 h-5 text-green-600" />
                      </div>
                      <div>
                        <div className="font-semibold text-gray-900 group-hover:text-green-700">数据分析</div>
                        <div className="text-sm text-gray-500">查看详细表现洞察</div>
                      </div>
                    </div>
                  </button>
                  
                  <button className="w-full p-4 border-2 border-dashed border-gray-300 rounded-xl hover:border-orange-400 hover:bg-orange-50 transition-all group text-left">
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-orange-100 group-hover:bg-orange-200 rounded-lg flex items-center justify-center mr-4 transition-colors">
                        <Calendar className="w-5 h-5 text-orange-600" />
                      </div>
                      <div>
                        <div className="font-semibold text-gray-900 group-hover:text-orange-700">安排复习</div>
                        <div className="text-sm text-gray-500">计划即将到来的课程</div>
                      </div>
                    </div>
                  </button>

                  <button className="w-full p-4 border-2 border-dashed border-gray-300 rounded-xl hover:border-red-400 hover:bg-red-50 transition-all group text-left">
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-red-100 group-hover:bg-red-200 rounded-lg flex items-center justify-center mr-4 transition-colors">
                        <Target className="w-5 h-5 text-red-600" />
                      </div>
                      <div>
                        <div className="font-semibold text-gray-900 group-hover:text-red-700">错题库</div>
                        <div className="text-sm text-gray-500">访问错题收集与分析</div>
                      </div>
                    </div>
                  </button>
                </div>
              </div>
            </div>

            {/* Achievement Badge */}
            <div className="card bg-gradient-to-br from-yellow-50 to-orange-50 border-yellow-200 animate-slide-up" style={{ animationDelay: '0.8s' }}>
              <div className="p-6 text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-glow">
                  <Award className="w-8 h-8 text-white" />
                </div>
                <h3 className="font-bold text-gray-900 mb-2">教学卓越</h3>
                <p className="text-sm text-gray-600 mb-4">
                  您本月保持了94%的学生成功率！
                </p>
                <div className="inline-flex items-center px-3 py-1 rounded-full bg-yellow-200 text-yellow-800 text-xs font-semibold">
                  <Sparkles className="w-3 h-3 mr-1" />
                  继续保持！
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Create Class Modal */}
      <CreateClassModal
        isOpen={isCreateClassModalOpen}
        onClose={() => setIsCreateClassModalOpen(false)}
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
              onClose={() => setShowQuestionGenerator(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
}
