import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTRPC } from "~/trpc/react";
import { useAuthStore } from "~/stores/authStore";
import { CreateClassModal } from "~/components/CreateClassModal";
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
  ChevronRight
} from "lucide-react";
import toast from "react-hot-toast";

export const Route = createFileRoute("/dashboard/")({
  component: Dashboard,
});

function Dashboard() {
  const navigate = useNavigate();
  const { authToken, teacher, isAuthenticated, logout } = useAuthStore();
  const [isCreateClassModalOpen, setIsCreateClassModalOpen] = useState(false);
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
    toast.success("Logged out successfully");
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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center mr-3">
                <GraduationCap className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-xl font-semibold text-gray-900">EduAnalytics</h1>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">{teacher.name}</p>
                <p className="text-xs text-gray-500">{teacher.phoneNumber || "Teacher"}</p>
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
            Welcome back, {teacher.name.split(' ')[0]}!
          </h2>
          <p className="text-gray-600">
            Here's what's happening with your classes today.
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Students</p>
                <p className="text-2xl font-bold text-gray-900">{totalStudents}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <BookOpen className="w-6 h-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Active Classes</p>
                <p className="text-2xl font-bold text-gray-900">{classes.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <FileText className="w-6 h-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Assignments</p>
                <p className="text-2xl font-bold text-gray-900">{totalAssignments}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Classes Section */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Your Classes</h3>
                <button 
                  onClick={() => setIsCreateClassModalOpen(true)}
                  className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  New Class
                </button>
              </div>
            </div>

            <div className="p-6">
              {classesQuery.isLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="animate-pulse">
                      <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                    </div>
                  ))}
                </div>
              ) : classes.length > 0 ? (
                <div className="space-y-4">
                  {classes.map((cls) => (
                    <div 
                      key={cls.id} 
                      onClick={() => handleClassClick(cls.id)}
                      className="p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-all cursor-pointer group"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900 group-hover:text-blue-700">{cls.name}</h4>
                          <p className="text-sm text-gray-500 mt-1">
                            {cls._count.students} students • {cls._count.assignments} assignments
                          </p>
                          {cls.description && (
                            <p className="text-xs text-gray-400 mt-1">{cls.description}</p>
                          )}
                        </div>
                        <div className="flex items-center space-x-3 text-gray-400">
                          <div className="flex items-center space-x-2">
                            <Clock className="w-4 h-4" />
                            <span className="text-xs">
                              {new Date(cls.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                          <ChevronRight className="w-4 h-4 group-hover:text-blue-600 transition-colors" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h4 className="text-lg font-medium text-gray-900 mb-2">No classes yet</h4>
                  <p className="text-gray-500 mb-6">Create your first class to get started</p>
                  <button 
                    onClick={() => setIsCreateClassModalOpen(true)}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 transition-colors"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Create Class
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Quick Actions</h3>
            </div>
            
            <div className="p-6">
              <div className="grid grid-cols-2 gap-4">
                <button className="p-6 border-2 border-dashed border-gray-300 rounded-lg hover:border-green-400 hover:bg-green-50 transition-all group">
                  <TrendingUp className="w-8 h-8 text-gray-400 group-hover:text-green-600 mx-auto mb-3" />
                  <p className="text-sm font-medium text-gray-600 group-hover:text-green-600">View Analytics</p>
                </button>
                
                <button className="p-6 border-2 border-dashed border-gray-300 rounded-lg hover:border-orange-400 hover:bg-orange-50 transition-all group">
                  <FileText className="w-8 h-8 text-gray-400 group-hover:text-orange-600 mx-auto mb-3" />
                  <p className="text-sm font-medium text-gray-600 group-hover:text-orange-600">Generate Reports</p>
                </button>
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
    </div>
  );
}
