import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import {
  ArrowLeft,
  BarChart3,
  Brain,
  Eye,
  FileText,
  Lock,
  NotebookTabs,
  Phone,
  School,
  ShieldCheck,
  Users,
} from "lucide-react";
import { useToast } from "~/components/Toast";
import { useAuthStore } from "~/stores/authStore";
import { useTRPC } from "~/trpc/react";

export const Route = createFileRoute("/auth/")({
  component: AuthPage,
});

const loginModes = ["教师登录", "家长登录"] as const;

function AuthPage() {
  const navigate = useNavigate();
  const toast = useToast();
  const trpc = useTRPC();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const setTeacherAuth = useAuthStore((state) => state.setTeacherAuth);
  const [activeMode, setActiveMode] =
    useState<(typeof loginModes)[number]>("教师登录");
  const demoLoginMutation = useMutation(trpc.loginDemo.mutationOptions());

  useEffect(() => {
    if (!isAuthenticated) return;
    const { userRole } = useAuthStore.getState();
    if (userRole === "parent") {
      void navigate({ to: "/parent-dashboard", replace: true });
      return;
    }
    void navigate({ to: "/dashboard", replace: true });
  }, [isAuthenticated, navigate]);

  const showNotAvailable = () => {
    toast.info("账号注册暂未开放，请先使用演示环境体验完整流程");
  };

  const handleDemoLogin = async () => {
    try {
      const result = await demoLoginMutation.mutateAsync({});
      setTeacherAuth(result.authToken, result.teacher);
      void navigate({ to: "/dashboard", replace: true });
    } catch {
      toast.error("演示账号暂不可用，请稍后再试");
    }
  };

  return (
    <div className="min-h-screen overflow-hidden bg-slate-50 text-slate-950">
      <header className="relative z-20 border-b border-slate-200/80 bg-white/95 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <button
            onClick={() => void navigate({ to: "/" })}
            className="flex items-center gap-2.5"
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-md bg-blue-600 text-white shadow-sm shadow-blue-600/20">
              <NotebookTabs className="h-5 w-5" />
            </span>
            <span className="text-lg font-bold tracking-tight">
              智评 EduReview
            </span>
          </button>

          <button
            onClick={() => void navigate({ to: "/" })}
            className="inline-flex h-10 items-center gap-2 rounded-md border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:border-blue-200 hover:text-blue-600"
          >
            <ArrowLeft className="h-4 w-4" />
            返回首页
          </button>
        </div>
      </header>

      <main className="relative">
        <div className="absolute inset-x-0 bottom-0 h-72 bg-blue-50" />
        <div className="relative mx-auto grid min-h-[calc(100vh-4rem)] max-w-7xl items-start gap-10 px-4 py-8 sm:px-6 lg:grid-cols-[0.86fr_1.14fr] lg:items-center lg:px-8">
          <section className="hidden max-w-xl lg:block">
            <div className="inline-flex items-center gap-2 rounded-full border border-blue-100 bg-white px-3 py-1 text-xs font-bold text-blue-600 shadow-sm">
              <ShieldCheck className="h-4 w-4" />
              教师演示环境已准备好
            </div>
            <h1 className="mt-6 text-4xl font-bold leading-tight tracking-tight text-slate-950 sm:text-5xl">
              欢迎回来
              <br />
              登录智评 EduReview
            </h1>
            <p className="mt-5 max-w-lg text-base leading-8 text-slate-600">
              继续查看作业批改、学情分析、学生画像和班级报告。当前正式账号体系暂未开放，你可以直接进入演示环境体验完整产品。
            </p>

            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              {[
                { icon: Brain, label: "AI 批改", value: "自动评分反馈" },
                { icon: BarChart3, label: "学情趋势", value: "班级变化可见" },
                { icon: Users, label: "学生画像", value: "薄弱点追踪" },
                { icon: FileText, label: "报告中心", value: "复盘一键生成" },
              ].map((item) => {
                const Icon = item.icon;
                return (
                  <div
                    key={item.label}
                    className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm"
                  >
                    <Icon className="h-5 w-5 text-blue-600" />
                    <div className="mt-3 text-sm font-bold text-slate-950">
                      {item.label}
                    </div>
                    <div className="mt-1 text-sm text-slate-500">
                      {item.value}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          <section className="relative lg:justify-self-end">
            <div className="absolute inset-x-6 top-8 hidden h-full rounded-lg bg-blue-100/70 lg:block" />
            <div className="relative mx-auto w-full max-w-md">
              <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-2xl shadow-slate-900/10 sm:p-8">
                <div className="mb-8 text-center">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-md bg-blue-600 text-white shadow-lg shadow-blue-600/20">
                    <NotebookTabs className="h-6 w-6" />
                  </div>
                  <h2 className="mt-4 text-2xl font-bold tracking-tight text-slate-950">
                    登录账号
                  </h2>
                  <p className="mt-2 text-sm text-slate-500">
                    输入账号密码登录，或直接体验演示环境
                  </p>
                </div>

                <div className="mb-6 grid grid-cols-2 rounded-md bg-slate-100 p-1">
                  {loginModes.map((mode) => (
                    <button
                      key={mode}
                      onClick={() => setActiveMode(mode)}
                      className={`h-10 rounded-md text-sm font-bold transition ${
                        activeMode === mode
                          ? "bg-white text-blue-600 shadow-sm"
                          : "text-slate-500 hover:text-slate-700"
                      }`}
                    >
                      {mode}
                    </button>
                  ))}
                </div>

                <div className="space-y-5">
                  <label className="block">
                    <span className="text-sm font-bold text-slate-700">
                      手机 / 账号
                    </span>
                    <span className="mt-2 flex h-12 items-center gap-3 rounded-md border border-slate-200 bg-slate-50 px-4">
                      <Phone className="h-5 w-5 text-slate-400" />
                      <input
                        type="tel"
                        disabled
                        placeholder="请输入教师手机号"
                        className="w-full border-0 bg-transparent p-0 text-sm text-slate-500 placeholder:text-slate-400 focus:ring-0"
                      />
                    </span>
                  </label>

                  <label className="block">
                    <span className="text-sm font-bold text-slate-700">
                      密码
                    </span>
                    <span className="mt-2 flex h-12 items-center gap-3 rounded-md border border-slate-200 bg-slate-50 px-4">
                      <Lock className="h-5 w-5 text-slate-400" />
                      <input
                        type="password"
                        disabled
                        placeholder="请输入密码"
                        className="w-full border-0 bg-transparent p-0 text-sm text-slate-500 placeholder:text-slate-400 focus:ring-0"
                      />
                      <Eye className="h-5 w-5 text-slate-300" />
                    </span>
                  </label>

                  <div className="flex items-center justify-between text-sm">
                    <label className="flex items-center gap-2 text-slate-500">
                      <input
                        type="checkbox"
                        disabled
                        className="rounded border-slate-300 text-blue-600"
                      />
                      记住我
                    </label>
                    <button
                      onClick={showNotAvailable}
                      className="font-semibold text-blue-600 hover:text-blue-700"
                    >
                      忘记密码？
                    </button>
                  </div>

                  <button
                    onClick={showNotAvailable}
                    className="h-12 w-full rounded-md bg-blue-600 text-sm font-bold text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-700"
                  >
                    登录
                  </button>

                  <button
                    onClick={() => void handleDemoLogin()}
                    disabled={demoLoginMutation.isPending}
                    className="h-12 w-full rounded-md border border-blue-200 bg-blue-50 text-sm font-bold text-blue-700 transition hover:bg-blue-100 disabled:opacity-60"
                  >
                    {demoLoginMutation.isPending ? "进入中..." : "体验演示账号"}
                  </button>
                </div>

                <div className="mt-6 border-t border-slate-100 pt-6 text-center">
                  <p className="text-xs font-semibold text-slate-400">
                    其他登录方式
                  </p>
                  <div className="mt-4 flex justify-center gap-3">
                    {[
                      {
                        label: "微信登录",
                        tone: "bg-emerald-50 text-emerald-600",
                        icon: <WeChatIcon className="h-5 w-5" />,
                      },
                      {
                        label: "校园账号登录",
                        tone: "bg-blue-50 text-blue-600",
                        icon: <School className="h-5 w-5" />,
                      },
                      {
                        label: "Google 登录",
                        tone: "bg-white ring-1 ring-slate-200",
                        icon: <GoogleIcon className="h-5 w-5" />,
                      },
                    ].map((item) => (
                      <button
                        key={item.label}
                        onClick={showNotAvailable}
                        className={`flex h-10 w-10 items-center justify-center rounded-full transition hover:scale-105 ${item.tone}`}
                        aria-label={item.label}
                        title={item.label}
                      >
                        {item.icon}
                      </button>
                    ))}
                  </div>
                  <p className="mt-5 text-sm text-slate-500">
                    还没有账号？
                    <button
                      onClick={showNotAvailable}
                      className="ml-1 font-bold text-blue-600 hover:text-blue-700"
                    >
                      立即注册
                    </button>
                  </p>
                </div>
              </div>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}

function WeChatIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={className}>
      <path
        fill="currentColor"
        d="M9.4 4.25c-4.02 0-7.28 2.65-7.28 5.92 0 1.86 1.06 3.53 2.72 4.61l-.54 1.92 2.35-1.12c.84.32 1.77.5 2.75.5.25 0 .5-.01.75-.04a5.52 5.52 0 0 1-.28-1.74c0-3.27 3.1-5.92 6.92-5.92.16 0 .31 0 .47.02-.92-2.42-3.99-4.15-7.86-4.15Zm-2.48 4.9a.9.9 0 1 1 0-1.8.9.9 0 0 1 0 1.8Zm4.96 0a.9.9 0 1 1 0-1.8.9.9 0 0 1 0 1.8Z"
      />
      <path
        fill="currentColor"
        d="M22 14.3c0-2.55-2.5-4.61-5.58-4.61s-5.58 2.06-5.58 4.61 2.5 4.62 5.58 4.62c.7 0 1.37-.11 1.99-.31l1.78.86-.4-1.47C21.13 17.17 22 15.83 22 14.3Zm-7.4-.78a.72.72 0 1 1 0-1.44.72.72 0 0 1 0 1.44Zm3.64 0a.72.72 0 1 1 0-1.44.72.72 0 0 1 0 1.44Z"
      />
    </svg>
  );
}

function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={className}>
      <path
        fill="#4285F4"
        d="M21.6 12.23c0-.78-.07-1.53-.2-2.23H12v4.22h5.37a4.6 4.6 0 0 1-1.99 3.02v2.51h3.23c1.89-1.74 2.99-4.3 2.99-7.52Z"
      />
      <path
        fill="#34A853"
        d="M12 22c2.7 0 4.96-.9 6.61-2.43l-3.23-2.51c-.9.6-2.04.95-3.38.95-2.6 0-4.81-1.76-5.6-4.12H3.06v2.59A9.99 9.99 0 0 0 12 22Z"
      />
      <path
        fill="#FBBC05"
        d="M6.4 13.89A6.01 6.01 0 0 1 6.09 12c0-.66.11-1.29.31-1.89V7.52H3.06A9.99 9.99 0 0 0 2 12c0 1.61.39 3.14 1.06 4.48l3.34-2.59Z"
      />
      <path
        fill="#EA4335"
        d="M12 5.99c1.47 0 2.78.5 3.82 1.49l2.86-2.86C16.95 3.01 14.7 2 12 2a9.99 9.99 0 0 0-8.94 5.52l3.34 2.59C7.19 7.75 9.4 5.99 12 5.99Z"
      />
    </svg>
  );
}
