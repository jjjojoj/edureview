import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuthStore } from "~/stores/authStore";
import { 
  GraduationCap, 
  BookOpen, 
  Users, 
  TrendingUp, 
  Sparkles,
  ArrowRight,
  Brain,
  Target,
  Award
} from "lucide-react";

export const Route = createFileRoute("/")({
  component: Home,
});

function Home() {
  const navigate = useNavigate();
  const { isAuthenticated, userRole } = useAuthStore();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (isAuthenticated) {
        if (userRole === "parent") {
          navigate({ to: "/parent-dashboard" });
        } else {
          navigate({ to: "/dashboard" });
        }
      } else {
        navigate({ to: "/auth" });
      }
    }, 2000); // Show the landing page for 2 seconds

    return () => clearTimeout(timer);
  }, [isAuthenticated, userRole, navigate]);

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 1000);
    return () => clearTimeout(timer);
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center">
        <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
        <div className="relative text-center animate-fade-in">
          <div className="w-24 h-24 bg-gradient-primary rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-glow-lg float-medium">
            <GraduationCap className="w-12 h-12 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-gradient-primary mb-4">智学分析</h1>
          <p className="text-xl text-gray-600 mb-8">用AI改变教育</p>
          <div className="flex justify-center space-x-2">
            <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse" style={{ animationDelay: '0s' }}></div>
            <div className="w-3 h-3 bg-indigo-500 rounded-full animate-pulse" style={{ animationDelay: '0.3s' }}></div>
            <div className="w-3 h-3 bg-purple-500 rounded-full animate-pulse" style={{ animationDelay: '0.6s' }}></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
      <div className="absolute top-20 left-20 w-64 h-64 bg-blue-400/10 rounded-full blur-3xl float-slow"></div>
      <div className="absolute bottom-20 right-20 w-80 h-80 bg-purple-400/10 rounded-full blur-3xl float-medium"></div>
      <div className="absolute top-1/2 left-1/4 w-32 h-32 bg-indigo-400/10 rounded-full blur-2xl float-fast"></div>

      <div className="relative min-h-screen flex items-center justify-center px-4">
        <div className="text-center max-w-6xl mx-auto animate-fade-in">
          {/* Hero Section */}
          <div className="mb-16">
            <div className="w-32 h-32 bg-gradient-primary rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-glow-lg float-medium">
              <GraduationCap className="w-16 h-16 text-white" />
            </div>
            
            <h1 className="text-6xl md:text-7xl font-bold mb-6 animate-slide-up">
              <span className="text-gradient-primary">智学</span>
              <span className="text-gray-900">分析</span>
            </h1>
            
            <p className="text-2xl md:text-3xl text-gray-600 mb-8 animate-slide-up" style={{ animationDelay: '0.2s' }}>
              用{" "}
              <span className="text-gradient-secondary font-semibold">AI智能分析</span>
              {" "}改变您的教学方式
            </p>
            
            <p className="text-lg text-gray-500 mb-12 max-w-3xl mx-auto leading-relaxed animate-slide-up" style={{ animationDelay: '0.4s' }}>
              简化作业管理，分析学生表现，获得深度洞察，
              帮助每个学生取得成功。加入数千名已在改变教学方式的教育工作者。
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-6 animate-slide-up" style={{ animationDelay: '0.6s' }}>
              <button 
                onClick={() => navigate({ to: "/auth" })}
                className="btn-primary text-lg px-8 py-4 group"
              >
                立即开始
                <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
              </button>
              
              <div className="flex items-center space-x-2 text-gray-500">
                <Sparkles className="w-5 h-5" />
                <span className="font-medium">免费试用</span>
              </div>
            </div>
          </div>

          {/* Features Grid */}
          <div className="grid md:grid-cols-3 gap-8 mb-16">
            <div className="card-interactive p-8 text-center animate-slide-up" style={{ animationDelay: '0.8s' }}>
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Brain className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">智能AI分析</h3>
              <p className="text-gray-600 leading-relaxed">
                先进的AI算法分析作业并提供详细反馈，
                帮助识别知识盲点和学习机会。
              </p>
            </div>

            <div className="card-interactive p-8 text-center animate-slide-up" style={{ animationDelay: '1s' }}>
              <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Users className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">班级管理</h3>
              <p className="text-gray-600 leading-relaxed">
                轻松组织学生，实时跟踪进度，
                使用为教育工作者设计的直观工具管理多个班级。
              </p>
            </div>

            <div className="card-interactive p-8 text-center animate-slide-up" style={{ animationDelay: '1.2s' }}>
              <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <TrendingUp className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">学习表现分析</h3>
              <p className="text-gray-600 leading-relaxed">
                全面洞察和可视化报告帮助您了解学生
                进度，做出数据驱动的决策以获得更好的学习成果。
              </p>
            </div>
          </div>

          {/* Stats Section */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-16">
            <div className="text-center animate-slide-up" style={{ animationDelay: '1.4s' }}>
              <div className="text-3xl font-bold text-gradient-primary mb-2">1万+</div>
              <div className="text-gray-600">教师</div>
            </div>
            <div className="text-center animate-slide-up" style={{ animationDelay: '1.5s' }}>
              <div className="text-3xl font-bold text-gradient-secondary mb-2">5万+</div>
              <div className="text-gray-600">学生</div>
            </div>
            <div className="text-center animate-slide-up" style={{ animationDelay: '1.6s' }}>
              <div className="text-3xl font-bold text-gradient-accent mb-2">100万+</div>
              <div className="text-gray-600">作业</div>
            </div>
            <div className="text-center animate-slide-up" style={{ animationDelay: '1.7s' }}>
              <div className="text-3xl font-bold text-gradient-primary mb-2">98%</div>
              <div className="text-gray-600">满意度</div>
            </div>
          </div>

          {/* CTA Section */}
          <div className="glass p-8 rounded-3xl animate-slide-up" style={{ animationDelay: '1.8s' }}>
            <div className="flex items-center justify-center mb-6">
              <Award className="w-8 h-8 text-yellow-500 mr-3" />
              <span className="text-lg font-semibold text-gray-700">准备好改变您的教学方式了吗？</span>
            </div>
            <button 
              onClick={() => navigate({ to: "/auth" })}
              className="btn-primary text-xl px-10 py-5 group"
            >
              开始您的旅程
              <Sparkles className="w-6 h-6 ml-3 group-hover:rotate-12 transition-transform" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
