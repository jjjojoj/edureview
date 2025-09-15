import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { LoginForm } from "~/components/LoginForm";
import { RegisterForm } from "~/components/RegisterForm";
import { useAuthStore } from "~/stores/authStore";
import { 
  GraduationCap, 
  BookOpen, 
  Users, 
  TrendingUp, 
  Heart,
  Sparkles,
  Brain,
  Target,
  ChevronRight
} from "lucide-react";

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
      
      {/* Floating Elements */}
      <div className="absolute top-20 left-20 w-64 h-64 bg-blue-400/10 rounded-full blur-3xl float-slow"></div>
      <div className="absolute bottom-20 right-20 w-80 h-80 bg-purple-400/10 rounded-full blur-3xl float-medium"></div>
      <div className="absolute top-1/2 right-1/4 w-32 h-32 bg-indigo-400/10 rounded-full blur-2xl float-fast"></div>
      
      <div className="relative min-h-screen flex">
        {/* Left Side - Branding */}
        <div className="hidden lg:flex lg:w-1/2 bg-gradient-primary p-12 flex-col justify-center relative overflow-hidden">
          <div className="absolute inset-0 bg-black/10"></div>
          
          {/* Decorative Elements */}
          <div className="absolute top-20 right-20 w-32 h-32 bg-white/10 rounded-full blur-xl float-slow"></div>
          <div className="absolute bottom-20 right-32 w-24 h-24 bg-purple-400/20 rounded-full blur-lg float-medium"></div>
          <div className="absolute top-1/2 right-8 w-16 h-16 bg-indigo-400/20 rounded-full blur-md float-fast"></div>
          
          <div className="relative z-10 animate-fade-in">
            <div className="flex items-center mb-8">
              <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center mr-4">
                <GraduationCap className="w-8 h-8 text-white" />
              </div>
              <h1 className="text-3xl font-bold text-white">智学分析</h1>
            </div>
            
            <h2 className="text-5xl font-bold text-white mb-6 leading-tight">
              用{" "}
              <span className="text-blue-200">AI智能分析</span> 
              {" "}改变您的教学方式
            </h2>
            
            <p className="text-blue-100 text-xl mb-12 leading-relaxed">
              简化作业管理，分析学生表现，获得深度洞察，
              帮助每个学生取得成功。已有数千名教育工作者在使用我们的平台。
            </p>

            <div className="space-y-8">
              <div className="flex items-start group">
                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center mr-6 group-hover:scale-110 transition-transform">
                  <Brain className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-white font-bold text-lg mb-2">智能作业分析</h3>
                  <p className="text-blue-100">AI智能反馈和评分辅助，提供详细见解</p>
                </div>
              </div>
              
              <div className="flex items-start group">
                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center mr-6 group-hover:scale-110 transition-transform">
                  <Users className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-white font-bold text-lg mb-2">轻松班级管理</h3>
                  <p className="text-blue-100">使用直观工具组织学生并跟踪进度</p>
                </div>
              </div>
              
              <div className="flex items-start group">
                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center mr-6 group-hover:scale-110 transition-transform">
                  <TrendingUp className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-white font-bold text-lg mb-2">学习表现分析</h3>
                  <p className="text-blue-100">全面洞察和精美可视化报告</p>
                </div>
              </div>
            </div>

            <div className="mt-12 p-6 bg-white/10 rounded-2xl backdrop-blur-sm">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-white font-bold text-sm mb-1">全球教育工作者信赖</div>
                  <div className="text-blue-200 text-sm">加入已在使用智学分析的10,000+教师</div>
                </div>
                <div className="flex -space-x-2">
                  <div className="w-10 h-10 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full border-2 border-white"></div>
                  <div className="w-10 h-10 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full border-2 border-white"></div>
                  <div className="w-10 h-10 bg-gradient-to-br from-pink-400 to-rose-500 rounded-full border-2 border-white"></div>
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-full border-2 border-white flex items-center justify-center">
                    <span className="text-white text-xs font-bold">+</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side - Auth Forms */}
        <div className="flex-1 flex items-center justify-center p-8 lg:p-12">
          <div className="w-full max-w-md animate-slide-up">
            {/* Role Selection */}
            <div className="mb-8">
              <div className="text-center mb-6">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">欢迎！</h3>
                <p className="text-gray-600">选择您的身份开始使用</p>
              </div>
              
              <div className="flex rounded-2xl border-2 border-gray-200 p-2 bg-gray-50">
                <button
                  onClick={() => setUserRole("teacher")}
                  className={`flex-1 py-3 px-4 rounded-xl text-sm font-semibold transition-all duration-300 ${
                    userRole === "teacher"
                      ? "bg-white text-blue-700 shadow-lg border border-blue-200 scale-105"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  <GraduationCap className="w-5 h-5 inline mr-2" />
                  教师
                  {userRole === "teacher" && <Sparkles className="w-4 h-4 inline ml-2" />}
                </button>
                <button
                  onClick={() => setUserRole("parent")}
                  className={`flex-1 py-3 px-4 rounded-xl text-sm font-semibold transition-all duration-300 ${
                    userRole === "parent"
                      ? "bg-white text-pink-700 shadow-lg border border-pink-200 scale-105"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  <Heart className="w-5 h-5 inline mr-2" />
                  家长
                  {userRole === "parent" && <Sparkles className="w-4 h-4 inline ml-2" />}
                </button>
              </div>
            </div>

            {/* Auth Forms */}
            <div className="animate-scale-in">
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
                <div className="card p-8 text-center">
                  <div className="w-16 h-16 bg-gradient-accent rounded-2xl flex items-center justify-center mx-auto mb-6">
                    <Heart className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-4">家长门户即将推出！</h3>
                  <p className="text-gray-600 mb-6">
                    我们正在努力为您打造出色的家长体验。
                    请稍后回来查看，届时您可以跟踪孩子的进度并参与他们的学习之旅。
                  </p>
                  <button
                    onClick={() => setUserRole("teacher")}
                    className="btn-secondary group"
                  >
                    尝试教师门户
                    <ChevronRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
