import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { LoginForm } from "~/components/LoginForm";
import { RegisterForm } from "~/components/RegisterForm";
import { ParentLoginForm } from "~/components/ParentLoginForm";
import { ParentRegisterForm } from "~/components/ParentRegisterForm";
import { useAuthStore } from "~/stores/authStore";
import { GraduationCap, BookOpen, Users, TrendingUp, Heart } from "lucide-react";

export const Route = createFileRoute("/auth/")({
  component: AuthPage,
});

function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [userRole, setUserRole] = useState<"teacher" | "parent">("teacher");
  const navigate = useNavigate();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  useEffect(() => {
    if (isAuthenticated) {
      const { userRole } = useAuthStore.getState();
      if (userRole === "parent") {
        navigate({ to: "/parent-dashboard" });
      } else {
        navigate({ to: "/dashboard" });
      }
    }
  }, [isAuthenticated, navigate]);

  const handleAuthSuccess = () => {
    const { userRole } = useAuthStore.getState();
    if (userRole === "parent") {
      navigate({ to: "/parent-dashboard" });
    } else {
      navigate({ to: "/dashboard" });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
      
      <div className="relative min-h-screen flex">
        {/* Left Side - Branding */}
        <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700 p-12 flex-col justify-center relative overflow-hidden">
          <div className="absolute inset-0 bg-black/10"></div>
          <div className="relative z-10">
            <div className="flex items-center mb-8">
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center mr-4">
                <GraduationCap className="w-8 h-8 text-white" />
              </div>
              <h1 className="text-3xl font-bold text-white">EduAnalytics</h1>
            </div>
            
            <h2 className="text-4xl font-bold text-white mb-6 leading-tight">
              Transform Your Teaching with AI-Powered Analytics
            </h2>
            
            <p className="text-blue-100 text-lg mb-12 leading-relaxed">
              Streamline assignment management, analyze student performance, and gain insights 
              that help every student succeed. Join thousands of educators already using our platform.
            </p>

            <div className="space-y-6">
              <div className="flex items-center">
                <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center mr-4">
                  <BookOpen className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-white font-semibold">Smart Assignment Analysis</h3>
                  <p className="text-blue-100 text-sm">AI-powered feedback and grading assistance</p>
                </div>
              </div>
              
              <div className="flex items-center">
                <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center mr-4">
                  <Users className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-white font-semibold">Class Management</h3>
                  <p className="text-blue-100 text-sm">Organize students and track progress effortlessly</p>
                </div>
              </div>
              
              <div className="flex items-center">
                <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center mr-4">
                  <TrendingUp className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-white font-semibold">Performance Analytics</h3>
                  <p className="text-blue-100 text-sm">Detailed insights and visual reports</p>
                </div>
              </div>
            </div>
          </div>
          
          {/* Decorative Elements */}
          <div className="absolute top-20 right-20 w-32 h-32 bg-white/10 rounded-full blur-xl"></div>
          <div className="absolute bottom-20 right-32 w-24 h-24 bg-purple-400/20 rounded-full blur-lg"></div>
          <div className="absolute top-1/2 right-8 w-16 h-16 bg-indigo-400/20 rounded-full blur-md"></div>
        </div>

        {/* Right Side - Auth Forms */}
        <div className="flex-1 flex items-center justify-center p-8 lg:p-12">
          <div className="w-full max-w-md">
            {/* Role Selection */}
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-gray-900 text-center mb-4">
                I am a...
              </h3>
              <div className="flex rounded-lg border border-gray-300 p-1 bg-gray-50">
                <button
                  onClick={() => setUserRole("teacher")}
                  className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all ${
                    userRole === "teacher"
                      ? "bg-white text-blue-700 shadow-sm border border-blue-200"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  <GraduationCap className="w-4 h-4 inline mr-2" />
                  Teacher
                </button>
                <button
                  onClick={() => setUserRole("parent")}
                  className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all ${
                    userRole === "parent"
                      ? "bg-white text-pink-700 shadow-sm border border-pink-200"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  <Users className="w-4 h-4 inline mr-2" />
                  Parent
                </button>
              </div>
            </div>

            {/* Auth Forms */}
            {userRole === "teacher" ? (
              isLogin ? (
                <LoginForm
                  onSuccess={handleAuthSuccess}
                  onSwitchToRegister={() => setIsLogin(false)}
                />
              ) : (
                <RegisterForm
                  onSuccess={() => setIsLogin(true)}
                  onSwitchToLogin={() => setIsLogin(true)}
                />
              )
            ) : (
              isLogin ? (
                <ParentLoginForm
                  onSuccess={handleAuthSuccess}
                  onSwitchToRegister={() => setIsLogin(false)}
                />
              ) : (
                <ParentRegisterForm
                  onSuccess={() => setIsLogin(true)}
                  onSwitchToLogin={() => setIsLogin(true)}
                />
              )
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
