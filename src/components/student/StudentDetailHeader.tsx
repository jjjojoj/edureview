import { useNavigate } from "@tanstack/react-router";
import {
  ArrowLeft,
  User,
  FileText,
  Award,
  TrendingUp,
  AlertTriangle,
} from "lucide-react";

interface StudentStatistics {
  totalAssignments?: number;
  totalExams?: number;
  totalMistakes?: number;
  averageProficiency?: number;
}

interface StudentDetailHeaderProps {
  studentName: string;
  classId: string;
  teacherName: string;
  statistics?: StudentStatistics;
}

export function StudentDetailHeader({
  studentName,
  classId,
  teacherName,
  statistics,
}: StudentDetailHeaderProps) {
  const navigate = useNavigate();

  return (
    <>
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
                    {studentName || "加载中..."}
                  </h1>
                  <p className="text-sm text-gray-500">学生档案</p>
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <div className="text-right">
                <p className="text-sm font-semibold text-gray-900">{teacherName}</p>
                <p className="text-xs text-gray-500">班主任</p>
              </div>
            </div>
          </div>
        </div>
      </header>

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
    </>
  );
}
