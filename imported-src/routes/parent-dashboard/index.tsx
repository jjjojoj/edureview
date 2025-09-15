import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTRPC } from "~/trpc/react";
import { useAuthStore } from "~/stores/authStore";
import { AssignmentUpload } from "~/components/AssignmentUpload";
import { 
  Upload, 
  Users, 
  BookOpen, 
  TrendingUp, 
  FileText, 
  Clock,
  Heart,
  LogOut,
  Settings,
  ChevronRight,
  Camera,
  BarChart3,
  Award,
  CheckCircle
} from "lucide-react";
import toast from "react-hot-toast";

export const Route = createFileRoute("/parent-dashboard/")({
  component: ParentDashboard,
});

function ParentDashboard() {
  const navigate = useNavigate();
  const { authToken, parent, userRole, isAuthenticated, logout } = useAuthStore();
  const [selectedChild, setSelectedChild] = useState<number | null>(null);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const trpc = useTRPC();

  useEffect(() => {
    if (!isAuthenticated || !authToken || userRole !== "parent") {
      navigate({ to: "/auth" });
    }
  }, [isAuthenticated, authToken, userRole, navigate]);

  useEffect(() => {
    // Set first child as selected by default
    if (parent?.children && parent.children.length > 0 && !selectedChild) {
      setSelectedChild(parent.children[0].id);
    }
  }, [parent?.children, selectedChild]);

  const childDataQuery = useQuery({
    ...trpc.getParentChildData.queryOptions({ 
      authToken: authToken || "", 
      childId: selectedChild || 0 
    }),
    enabled: !!authToken && !!selectedChild,
  });

  const handleLogout = () => {
    logout();
    toast.success("已成功退出登录");
    navigate({ to: "/auth" });
  };

  const handleUploadAssignment = () => {
    setShowUploadModal(true);
  };

  const handleUploadSuccess = () => {
    setShowUploadModal(false);
    childDataQuery.refetch();
  };

  if (!isAuthenticated || !parent) {
    return null;
  }

  const currentChild = parent.children?.find(child => child.id === selectedChild);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-gradient-to-br from-pink-500 to-rose-600 rounded-xl flex items-center justify-center mr-3">
                <Heart className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-xl font-semibold text-gray-900">家长门户</h1>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">{parent.name}</p>
                <p className="text-xs text-gray-500">{parent.phoneNumber}</p>
              </div>
              <div className="flex items-center space-x-2">
                <button className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors">
                  <Settings className="w-5 h-5" />
                </button>
                <button 
                  onClick={handleLogout}
                  className="p-2 text-gray-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            欢迎，{parent.name.split(' ')[0]}！
          </h2>
          <p className="text-gray-600">
            跟踪您孩子的学习进度并上传作业进行分析。
          </p>
        </div>

        {/* Child Selection */}
        {parent.children && parent.children.length > 1 && (
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">选择孩子</h3>
            <div className="flex space-x-4">
              {parent.children.map((child) => (
                <button
                  key={child.id}
                  onClick={() => setSelectedChild(child.id)}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    selectedChild === child.id
                      ? "border-pink-500 bg-pink-50 text-pink-700"
                      : "border-gray-200 hover:border-gray-300 text-gray-700"
                  }`}
                >
                  <div className="text-left">
                    <p className="font-medium">{child.name}</p>
                    <p className="text-sm text-gray-500">{child.grade} • {child.className}</p>
                    <p className="text-xs text-gray-400">{child.schoolName}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {currentChild && (
          <>
            {/* Child Info Card */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
              <div className="flex items-center">
                <div className="w-16 h-16 bg-gradient-to-br from-pink-100 to-rose-100 rounded-full flex items-center justify-center">
                  <Users className="w-8 h-8 text-pink-600" />
                </div>
                <div className="ml-4">
                  <h3 className="text-xl font-bold text-gray-900">{currentChild.name}</h3>
                  <p className="text-gray-600">{currentChild.grade} • {currentChild.className}</p>
                  <p className="text-sm text-gray-500">{currentChild.schoolName}</p>
                </div>
              </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <FileText className="w-6 h-6 text-blue-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">作业数</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {childDataQuery.data?.statistics.totalAssignments || 0}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                    <Award className="w-6 h-6 text-green-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">平均分</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {childDataQuery.data?.statistics.averageScore 
                        ? `${childDataQuery.data.statistics.averageScore.toFixed(1)}%`
                        : "-"
                      }
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                    <TrendingUp className="w-6 h-6 text-purple-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">分析率</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {childDataQuery.data?.statistics.analysisRate 
                        ? `${childDataQuery.data.statistics.analysisRate.toFixed(0)}%`
                        : "-"
                      }
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Assignment Upload */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200">
                <div className="p-6 border-b border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900">上传作业</h3>
                  <p className="text-sm text-gray-600 mt-1">
                    上传您孩子的作业以获得AI分析和反馈
                  </p>
                </div>

                <div className="p-6">
                  <div 
                    onClick={handleUploadAssignment}
                    className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-pink-400 hover:bg-pink-50 transition-all cursor-pointer group"
                  >
                    <Camera className="w-12 h-12 text-gray-400 group-hover:text-pink-600 mx-auto mb-4" />
                    <h4 className="text-lg font-medium text-gray-900 group-hover:text-pink-700 mb-2">
                      上传作业照片
                    </h4>
                    <p className="text-gray-500 mb-4">
                      拍照或上传作业图片
                    </p>
                    <button className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-pink-600 hover:bg-pink-700 transition-colors">
                      <Upload className="w-4 h-4 mr-2" />
                      选择文件
                    </button>
                  </div>
                </div>
              </div>

              {/* Recent Activity */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200">
                <div className="p-6 border-b border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900">最近作业</h3>
                </div>
                
                <div className="p-6">
                  {childDataQuery.isLoading ? (
                    <div className="space-y-4">
                      {[1, 2, 3].map((i) => (
                        <div key={i} className="animate-pulse">
                          <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                          <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                        </div>
                      ))}
                    </div>
                  ) : childDataQuery.data?.assignments.length ? (
                    <div className="space-y-4">
                      {childDataQuery.data.assignments.slice(0, 5).map((assignment) => (
                        <div key={assignment.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div className="flex-1">
                            <h4 className="font-medium text-gray-900">{assignment.title}</h4>
                            <p className="text-sm text-gray-500">
                              {assignment.uploadedBy === "parent" ? "您上传的" : "老师布置的"} • 
                              {new Date(assignment.createdAt).toLocaleDateString('zh-CN')}
                            </p>
                            {assignment.analysis && (
                              <div className="flex items-center mt-1">
                                <CheckCircle className="w-4 h-4 text-green-500 mr-1" />
                                <span className="text-xs text-green-600">已分析</span>
                                {assignment.analysis.grade && (
                                  <span className="text-xs text-gray-500 ml-2">
                                    成绩: {assignment.analysis.grade}
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                          <ChevronRight className="w-4 h-4 text-gray-400" />
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <h4 className="text-lg font-medium text-gray-900 mb-2">还没有作业</h4>
                      <p className="text-gray-500 mb-6">
                        上传您的第一个作业以查看分析和进度跟踪
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Upload Modal */}
      {showUploadModal && selectedChild && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <AssignmentUpload
              childId={selectedChild}
              onSuccess={handleUploadSuccess}
              onClose={() => setShowUploadModal(false)}
            />
          </div>
        </div>
      )}

      {/* Subject Progress Section */}
      {childDataQuery.data?.knowledgeAreas.length ? (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">学科进度</h3>
                  <p className="text-sm text-gray-600 mt-1">
                    {currentChild?.name}在各学科的表现
                  </p>
                </div>
                <BookOpen className="w-6 h-6 text-pink-600" />
              </div>
            </div>
            
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {childDataQuery.data.knowledgeAreas.map((area) => {
                  const proficiencyPercent = Math.round(area.proficiency * 100);
                  const getSubjectIcon = (name: string) => {
                    const lowerName = name.toLowerCase();
                    if (lowerName.includes('math') || lowerName.includes('arithmetic')) return '🔢';
                    if (lowerName.includes('physics')) return '⚡';
                    if (lowerName.includes('chemistry')) return '🧪';
                    if (lowerName.includes('biology')) return '🌱';
                    if (lowerName.includes('english') || lowerName.includes('language')) return '📚';
                    if (lowerName.includes('history')) return '📜';
                    if (lowerName.includes('geography')) return '🌍';
                    if (lowerName.includes('art')) return '🎨';
                    if (lowerName.includes('music')) return '🎵';
                    if (lowerName.includes('science')) return '🔬';
                    return '📖';
                  };

                  const getProficiencyColor = (proficiency: number) => {
                    if (proficiency >= 0.8) return 'text-green-600 bg-green-100';
                    if (proficiency >= 0.6) return 'text-blue-600 bg-blue-100';
                    if (proficiency >= 0.4) return 'text-yellow-600 bg-yellow-100';
                    return 'text-red-600 bg-red-100';
                  };

                  const getProgressBarColor = (proficiency: number) => {
                    if (proficiency >= 0.8) return 'bg-green-500';
                    if (proficiency >= 0.6) return 'bg-blue-500';
                    if (proficiency >= 0.4) return 'bg-yellow-500';
                    return 'bg-red-500';
                  };

                  return (
                    <div key={area.id} className="bg-gray-50 rounded-lg p-5 border border-gray-100 hover:shadow-md transition-shadow">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center">
                          <span className="text-2xl mr-3">{getSubjectIcon(area.name)}</span>
                          <div>
                            <h4 className="font-semibold text-gray-900">{area.name}</h4>
                            {area.description && (
                              <p className="text-xs text-gray-500 mt-1">{area.description}</p>
                            )}
                          </div>
                        </div>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getProficiencyColor(area.proficiency)}`}>
                          {proficiencyPercent}%
                        </span>
                      </div>

                      <div className="mb-3">
                        <div className="flex items-center justify-between text-sm mb-1">
                          <span className="text-gray-600">熟练度</span>
                          <span className="font-medium text-gray-900">{proficiencyPercent}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-3">
                          <div 
                            className={`h-3 rounded-full transition-all duration-300 ${getProgressBarColor(area.proficiency)}`}
                            style={{ width: `${proficiencyPercent}%` }}
                          ></div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <span>最后更新</span>
                        <span>{new Date(area.lastUpdated).toLocaleDateString('zh-CN')}</span>
                      </div>

                      {proficiencyPercent >= 80 && (
                        <div className="mt-2 flex items-center text-xs text-green-600">
                          <Award className="w-3 h-3 mr-1" />
                          <span>进步优秀！</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {childDataQuery.data.knowledgeAreas.length === 0 && (
                <div className="text-center py-12">
                  <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h4 className="text-lg font-medium text-gray-900 mb-2">暂无学科数据</h4>
                  <p className="text-gray-500">
                    分析作业后，学科进度将显示在这里
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
