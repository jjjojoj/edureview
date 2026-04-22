import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTRPC } from "~/trpc/react";
import { useAuthStore } from "~/stores/authStore";
import { RequireAuth } from "~/components/RequireAuth";
import { StudentDetailHeader } from "~/components/student/StudentDetailHeader";
import { StudentPerformanceChart } from "~/components/student/StudentPerformanceChart";
import {
  User,
  FileText,
  CheckCircle,
  Clock,
  Award,
  Target,
  Brain,
} from "lucide-react";

export const Route = createFileRoute("/classes/$classId/students/$studentId/")({
  component: StudentProfile,
});

function StudentProfile() {
  const navigate = useNavigate();
  const { classId, studentId } = Route.useParams();
  const { authToken, teacher } = useAuthStore();
  const trpc = useTRPC();
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d' | '1y' | 'all'>('30d');

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

  if (!teacher) {
    return null;
  }

  const studentData = studentQuery.data?.student;
  const statistics = studentQuery.data?.statistics;

  return (
    <RequireAuth>
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-indigo-50/30">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>

      <StudentDetailHeader
        studentName={studentData?.name || ""}
        classId={classId}
        teacherName={teacher.name}
        statistics={statistics}
      />

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
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Main Content */}
              <div className="lg:col-span-2 space-y-8">
                {/* Performance Charts */}
                <StudentPerformanceChart
                  timeRange={timeRange}
                  onTimeRangeChange={setTimeRange}
                  data={performanceTrendsQuery.data}
                />

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
                        {studentData.assignments.slice(0, 5).map((assignment) => (
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
                        {studentData.exams.slice(0, 5).map((exam) => (
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
                        {statistics.mistakesByKnowledgeArea.slice(0, 5).map((area) => (
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
                        {studentData.studentKnowledgeAreas.map((ska) => (
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
    </RequireAuth>
  );
}
