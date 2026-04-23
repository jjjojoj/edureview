import { useNavigate } from "@tanstack/react-router";
import { useMutation } from "@tanstack/react-query";
import { type ReactNode, useState } from "react";
import { toast } from "react-hot-toast";
import { Lock, Menu, NotebookTabs, X } from "lucide-react";
import { useAuthStore } from "~/stores/authStore";
import { useTRPC } from "~/trpc/react";

type MarketingShellProps = {
  active?: "features" | "solutions" | "pricing" | "help";
  children: ReactNode;
};

const navItems = [
  { key: "features", label: "功能特性", href: "/features" },
  { key: "solutions", label: "解决方案", href: "/solutions" },
  { key: "pricing", label: "定价", href: "/pricing" },
  { key: "help", label: "帮助中心", href: "/help" },
] as const;

export function MarketingShell({ active, children }: MarketingShellProps) {
  const navigate = useNavigate();
  const setTeacherAuth = useAuthStore((s) => s.setTeacherAuth);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const trpc = useTRPC();
  const demoLoginMutation = useMutation(trpc.loginDemo.mutationOptions());

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
    <div className="min-h-screen bg-white text-slate-950">
      <header className="sticky inset-x-0 top-0 z-50 border-b border-slate-200/70 bg-white/95 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <a href="/" className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-md bg-blue-600 text-white shadow-sm shadow-blue-600/20">
              <NotebookTabs className="h-5 w-5" />
            </span>
            <span className="text-lg font-bold tracking-tight">
              智评 EduReview
            </span>
          </a>

          <nav className="hidden items-center gap-10 md:flex">
            {navItems.map((item) => (
              <a
                key={item.key}
                href={item.href}
                className={`text-sm font-semibold transition ${
                  active === item.key
                    ? "text-blue-600"
                    : "text-slate-600 hover:text-blue-600"
                }`}
              >
                {item.label}
              </a>
            ))}
          </nav>

          <div className="hidden items-center gap-3 md:flex">
            <button
              onClick={() => void navigate({ to: "/auth" })}
              className="h-10 px-3 text-sm font-semibold text-slate-700 transition hover:text-blue-600"
            >
              登录
            </button>
            <button
              onClick={() => void handleDemoLogin()}
              disabled={demoLoginMutation.isPending}
              className="h-10 rounded-md bg-blue-600 px-5 text-sm font-semibold text-white shadow-sm shadow-blue-600/20 transition hover:bg-blue-700 disabled:opacity-60"
            >
              {demoLoginMutation.isPending ? "登录中..." : "体验演示"}
            </button>
          </div>

          <button
            onClick={() => setMobileMenuOpen((open) => !open)}
            className="rounded-md p-2 text-slate-600 transition hover:bg-slate-100 md:hidden"
            aria-label="打开导航"
          >
            {mobileMenuOpen ? (
              <X className="h-5 w-5" />
            ) : (
              <Menu className="h-5 w-5" />
            )}
          </button>
        </div>

        {mobileMenuOpen ? (
          <div className="border-t border-slate-200 bg-white px-4 py-3 md:hidden">
            <div className="space-y-1">
              {navItems.map((item) => (
                <a
                  key={item.key}
                  href={item.href}
                  className="block rounded-md px-3 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50"
                >
                  {item.label}
                </a>
              ))}
              <div className="grid grid-cols-2 gap-2 pt-2">
                <button
                  onClick={() => void navigate({ to: "/auth" })}
                  className="rounded-md border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700"
                >
                  登录
                </button>
                <button
                  onClick={() => void handleDemoLogin()}
                  disabled={demoLoginMutation.isPending}
                  className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
                >
                  {demoLoginMutation.isPending ? "登录中..." : "体验演示"}
                </button>
              </div>
            </div>
          </div>
        ) : null}
      </header>

      {children}

      <footer className="border-t border-slate-200 bg-white py-10">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 text-sm text-slate-500 sm:px-6 md:flex-row md:items-center md:justify-between lg:px-8">
          <a href="/" className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-md bg-blue-600 text-white">
              <NotebookTabs className="h-4 w-4" />
            </span>
            <span className="font-bold text-slate-900">智评 EduReview</span>
          </a>
          <div>© 2026 智评 EduReview. All rights reserved.</div>
          <div className="flex items-center gap-2">
            <Lock className="h-4 w-4 text-emerald-600" />
            数据安全，加密传输
          </div>
        </div>
      </footer>
    </div>
  );
}

export function MarketingSectionHeader({
  eyebrow,
  title,
  description,
}: {
  eyebrow?: string;
  title: string;
  description: string;
}) {
  return (
    <div className="mx-auto max-w-3xl text-center">
      {eyebrow ? (
        <div className="text-sm font-bold text-blue-600">{eyebrow}</div>
      ) : null}
      <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
        {title}
      </h1>
      <p className="mt-4 leading-7 text-slate-600">{description}</p>
    </div>
  );
}
