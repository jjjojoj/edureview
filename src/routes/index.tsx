import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { toast } from "react-hot-toast";
import {
  ArrowRight,
  BarChart3,
  Brain,
  Check,
  ChevronDown,
  ClipboardCheck,
  FileBarChart,
  FileText,
  Lock,
  Menu,
  NotebookTabs,
  PenTool,
  Search,
  Target,
  Users,
  X,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useAuthStore } from "~/stores/authStore";
import { useTRPC } from "~/trpc/react";

export const Route = createFileRoute("/")({
  component: Home,
});

type FeatureCard = {
  icon: LucideIcon;
  title: string;
  description: string;
  tone: string;
};

function Home() {
  const navigate = useNavigate();
  const { isAuthenticated, userRole } = useAuthStore();
  const setTeacherAuth = useAuthStore((s) => s.setTeacherAuth);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const trpc = useTRPC();
  const demoLoginMutation = useMutation(trpc.loginDemo.mutationOptions());

  useEffect(() => {
    if (!isAuthenticated) return;
    if (userRole === "parent") {
      void navigate({ to: "/parent-dashboard" });
      return;
    }
    void navigate({ to: "/dashboard", replace: true });
  }, [isAuthenticated, userRole, navigate]);

  const handleDemoLogin = async () => {
    try {
      const result = await demoLoginMutation.mutateAsync({});
      setTeacherAuth(result.authToken, result.teacher);
      void navigate({ to: "/dashboard", replace: true });
    } catch {
      toast.error("演示账号暂不可用，请稍后再试");
    }
  };

  const navItems = [
    { href: "/features", label: "功能特性" },
    { href: "/solutions", label: "解决方案" },
    { href: "/pricing", label: "定价" },
    { href: "/help", label: "帮助中心" },
  ] as const;

  const heroCards: FeatureCard[] = [
    {
      icon: ClipboardCheck,
      title: "AI 批改与反馈",
      description: "支持作业与试卷识别，自动评分、提取反馈，减少重复批改。",
      tone: "bg-blue-600",
    },
    {
      icon: Target,
      title: "知识点错因归因",
      description: "基于错题和知识图谱定位薄弱点，避免反复讲同一类问题。",
      tone: "bg-violet-600",
    },
    {
      icon: FileBarChart,
      title: "班级学情报告",
      description: "自动生成班级与学生多维学情报告，趋势变化一目了然。",
      tone: "bg-emerald-600",
    },
  ];

  const features: FeatureCard[] = [
    {
      icon: Brain,
      title: "AI 智能批改",
      description: "识别学生作答内容，自动给出评分、反馈与可复盘的分析结果。",
      tone: "bg-emerald-50 text-emerald-700",
    },
    {
      icon: BarChart3,
      title: "学情趋势分析",
      description: "从班级平均、分层变化、知识点掌握率中发现真实教学信号。",
      tone: "bg-blue-50 text-blue-700",
    },
    {
      icon: Target,
      title: "错因归类与追踪",
      description: "按学生、知识点和题型沉淀错题，帮助教师安排针对性复习。",
      tone: "bg-rose-50 text-rose-700",
    },
    {
      icon: PenTool,
      title: "个性化练习",
      description: "根据错题库和薄弱知识点生成练习题，让补弱更具体。",
      tone: "bg-indigo-50 text-indigo-700",
    },
    {
      icon: Users,
      title: "班级与学生管理",
      description: "支持班级档案、学生分组、重点关注对象和个人学习画像。",
      tone: "bg-cyan-50 text-cyan-700",
    },
    {
      icon: FileText,
      title: "报告自动生成",
      description: "为课堂复盘、阶段总结和家校沟通生成结构化学情报告。",
      tone: "bg-amber-50 text-amber-700",
    },
  ];

  const solutionTabs = ["K12 教师", "培训机构", "学校教研", "家校沟通"];
  const pricingPlans = [
    {
      name: "教师体验",
      description: "面向个人教师的基础教学分析能力",
      features: ["作业与试卷分析", "班级趋势看板", "学生画像预览"],
    },
    {
      name: "教研协作",
      description: "面向备课组和多班级协同场景",
      features: ["多班级对比", "错因归因沉淀", "教研报告生成"],
    },
    {
      name: "学校与机构",
      description: "适合学校和培训机构",
      features: ["校级数据看板", "教师权限管理", "专属部署支持"],
    },
  ];

  const faqs = [
    {
      q: "智评 EduReview 适合哪些老师使用？",
      a: "适合中小学教师、培训机构老师和需要做阶段性学情复盘的教研团队。数学、英语、语文等学科都可以围绕作业、试卷和错题进行分析。",
    },
    {
      q: "上传作业后会自动生成哪些内容？",
      a: "系统会识别作答内容，生成评分与反馈，并把错题沉淀到知识点、学生画像和班级趋势里，方便后续复习和出题。",
    },
    {
      q: "数据安全如何保障？",
      a: "教师和学生数据仅用于教学分析场景，传输过程加密，后续也可以按学校要求接入更细的权限和数据管理策略。",
    },
    {
      q: "现在可以正式注册吗？",
      a: "注册入口暂未开放，你可以先使用「体验演示」查看完整产品流程和仪表盘效果。",
    },
  ];

  return (
    <div className="min-h-screen bg-white text-slate-950">
      <header className="fixed inset-x-0 top-0 z-50 border-b border-slate-200/70 bg-white/95 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <button
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            className="flex items-center gap-2.5"
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-md bg-blue-600 text-white shadow-sm shadow-blue-600/20">
              <NotebookTabs className="h-5 w-5" />
            </span>
            <span className="text-lg font-bold tracking-tight">
              智评 EduReview
            </span>
          </button>

          <nav className="hidden items-center gap-10 md:flex">
            {navItems.map((item) => (
              <a
                key={item.href}
                href={item.href}
                className="text-sm font-semibold text-slate-600 transition hover:text-blue-600"
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
                  key={item.href}
                  href={item.href}
                  className="block w-full rounded-md px-3 py-2 text-left text-sm font-semibold text-slate-600 hover:bg-slate-50"
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

      <main>
        <section className="relative overflow-hidden pt-16">
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{
              backgroundImage:
                "url('https://images.unsplash.com/photo-1503676260728-1c00da094a0b?auto=format&fit=crop&w=2400&q=80')",
            }}
          />
          <div className="absolute inset-0 bg-white/80" />
          <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-white to-white/0" />

          <div className="relative mx-auto grid min-h-[620px] max-w-[92rem] items-center gap-8 px-4 py-16 sm:px-6 lg:min-h-[700px] lg:grid-cols-[0.72fr_1.28fr] lg:px-8">
            <div className="max-w-xl">
              <h1 className="text-4xl font-bold leading-tight tracking-tight text-slate-950 sm:text-5xl lg:text-6xl">
                AI 让每一次作业，
                <br />
                <span className="hidden sm:inline">都变成可行动的学情洞察</span>
                <span className="sm:hidden">
                  都变成可行动的
                  <br />
                  学情洞察
                </span>
              </h1>
              <p className="mt-7 max-w-lg text-base leading-8 text-slate-600 sm:text-lg">
                上传作业与试卷，自动识别、评分、归因错题，生成班级趋势、学生画像和针对性练习。
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <button
                  onClick={() => void handleDemoLogin()}
                  disabled={demoLoginMutation.isPending}
                  className="inline-flex h-12 items-center justify-center rounded-md bg-blue-600 px-8 text-sm font-bold text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-700 disabled:opacity-60"
                >
                  {demoLoginMutation.isPending ? "登录中..." : "体验演示"}
                </button>
                <button
                  onClick={() => void navigate({ to: "/features" })}
                  className="inline-flex h-12 items-center justify-center rounded-md border border-slate-300 bg-white/80 px-8 text-sm font-bold text-slate-700 transition hover:border-blue-300 hover:text-blue-600"
                >
                  查看功能
                </button>
              </div>
            </div>

            <HeroProductMockup />
          </div>
        </section>

        <section className="relative z-10 -mt-10 pb-16">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid gap-5 md:grid-cols-3">
              {heroCards.map((card) => (
                <FeatureTile key={card.title} {...card} />
              ))}
            </div>
          </div>
        </section>

        <section id="features" className="bg-white py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <SectionHeader
              eyebrow="核心功能特性"
              title="从批改到复习，围绕课堂真实流程设计"
              description="智评把作业、试卷、错题、知识点和报告串成一条清晰的数据链，让老师少做重复整理，多做有效判断。"
            />
            <div className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {features.map((feature) => (
                <ProductFeature key={feature.title} {...feature} />
              ))}
            </div>
          </div>
        </section>

        <section id="solutions" className="bg-slate-50 py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <SectionHeader
              eyebrow="解决方案"
              title="为不同教学场景提供 AI 能力"
              description="从一线课堂、培训机构到学校教研，围绕作业数据沉淀可复用的教学洞察。"
            />
            <div className="mt-8 flex flex-wrap justify-center gap-2">
              {solutionTabs.map((tab, index) => (
                <button
                  key={tab}
                  className={`rounded-md px-5 py-2 text-sm font-bold ${
                    index === 0
                      ? "bg-blue-600 text-white"
                      : "bg-white text-slate-600 ring-1 ring-slate-200"
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            <div className="mt-10 grid overflow-hidden rounded-lg border border-slate-200 bg-white lg:grid-cols-[0.9fr_1.1fr]">
              <div
                className="min-h-[320px] bg-cover bg-center"
                style={{
                  backgroundImage:
                    "url('https://images.unsplash.com/photo-1509062522246-3755977927d7?auto=format&fit=crop&w=1400&q=80')",
                }}
              />
              <div className="p-8 lg:p-10">
                <div className="text-sm font-bold text-blue-600">
                  K12 教育解决方案
                </div>
                <h3 className="mt-3 text-2xl font-bold tracking-tight text-slate-950">
                  覆盖作业、试卷、错题和家校沟通的完整闭环
                </h3>
                <p className="mt-4 leading-7 text-slate-600">
                  教师上传日常作业和阶段测验，系统自动生成班级趋势、知识点掌握和学生画像，帮助老师更快定位下一节课该讲什么。
                </p>
                <ul className="mt-6 space-y-3">
                  {[
                    "作业批改结果自动沉淀到学生画像",
                    "错题按知识点和题型归因",
                    "班级报告可用于复盘与家校沟通",
                  ].map((item) => (
                    <li key={item} className="flex items-center gap-3">
                      <Check className="h-5 w-5 text-blue-600" />
                      <span className="text-sm font-semibold text-slate-700">
                        {item}
                      </span>
                    </li>
                  ))}
                </ul>
                <button
                  onClick={() => void handleDemoLogin()}
                  className="mt-8 inline-flex h-11 items-center gap-2 rounded-md border border-blue-200 px-5 text-sm font-bold text-blue-600 transition hover:bg-blue-50"
                >
                  了解体验
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </section>

        <section id="pricing" className="bg-white py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <SectionHeader
              eyebrow="定价方案"
              title="商业定价暂未开放"
              description="智评 EduReview 仍处于产品演示与内测阶段，暂不提供付费购买入口。你可以先进入演示环境查看完整流程。"
            />
            <div className="mt-10 grid gap-5 lg:grid-cols-3">
              {pricingPlans.map((plan) => (
                <div
                  key={plan.name}
                  className="relative rounded-lg border border-slate-200 bg-white p-6"
                >
                  <span className="absolute right-4 top-4 rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-500">
                    暂未开放
                  </span>
                  <h3 className="text-lg font-bold text-slate-950">
                    {plan.name}
                  </h3>
                  <p className="mt-2 text-sm text-slate-500">
                    {plan.description}
                  </p>
                  <div className="mt-6 text-3xl font-bold text-slate-950">
                    暂未开放
                  </div>
                  <ul className="mt-6 space-y-3">
                    {plan.features.map((item) => (
                      <li key={item} className="flex items-center gap-2">
                        <Check className="h-4 w-4 text-blue-600" />
                        <span className="text-sm text-slate-600">{item}</span>
                      </li>
                    ))}
                  </ul>
                  <button className="mt-8 h-11 w-full cursor-not-allowed rounded-md border border-slate-200 bg-slate-50 text-sm font-bold text-slate-400">
                    暂未开放
                  </button>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="help" className="bg-slate-50 py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr]">
              <div>
                <div className="text-sm font-bold text-blue-600">帮助中心</div>
                <h2 className="mt-3 text-3xl font-bold tracking-tight text-slate-950">
                  常见问题
                </h2>
                <p className="mt-4 leading-7 text-slate-600">
                  这里整理了老师在试用前最常问的问题。你也可以先进入演示环境，直接体验完整工作流。
                </p>
                <div className="mt-6 flex max-w-md items-center gap-3 rounded-lg bg-white px-4 py-3 ring-1 ring-slate-200">
                  <Search className="h-5 w-5 text-slate-400" />
                  <span className="text-sm text-slate-400">
                    搜索帮助文档...
                  </span>
                </div>
              </div>

              <div className="rounded-lg border border-slate-200 bg-white">
                {faqs.map((faq, index) => (
                  <div
                    key={faq.q}
                    className="border-b border-slate-100 last:border-b-0"
                  >
                    <button
                      onClick={() =>
                        setOpenFaq(openFaq === index ? null : index)
                      }
                      className="flex w-full items-center justify-between gap-4 px-6 py-5 text-left"
                    >
                      <span className="font-bold text-slate-900">{faq.q}</span>
                      <ChevronDown
                        className={`h-5 w-5 shrink-0 text-slate-400 transition ${
                          openFaq === index ? "rotate-180" : ""
                        }`}
                      />
                    </button>
                    {openFaq === index ? (
                      <p className="px-6 pb-5 text-sm leading-7 text-slate-600">
                        {faq.a}
                      </p>
                    ) : null}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="bg-white py-16">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col items-start justify-between gap-6 rounded-lg bg-slate-950 px-8 py-10 text-white md:flex-row md:items-center">
              <div>
                <h2 className="text-2xl font-bold tracking-tight">
                  先从一节课、一批作业开始
                </h2>
                <p className="mt-2 text-sm leading-6 text-slate-300">
                  体验演示环境，查看作业分析、学生排行、知识点掌握和报告生成。
                </p>
              </div>
              <button
                onClick={() => void handleDemoLogin()}
                disabled={demoLoginMutation.isPending}
                className="inline-flex h-12 items-center justify-center rounded-md bg-white px-8 text-sm font-bold text-slate-950 transition hover:bg-blue-50 disabled:opacity-60"
              >
                {demoLoginMutation.isPending ? "登录中..." : "体验演示"}
              </button>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-slate-200 bg-white py-10">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 text-sm text-slate-500 sm:px-6 md:flex-row md:items-center md:justify-between lg:px-8">
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-md bg-blue-600 text-white">
              <NotebookTabs className="h-4 w-4" />
            </span>
            <span className="font-bold text-slate-900">智评 EduReview</span>
          </div>
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

function HeroProductMockup() {
  return (
    <div className="relative mx-auto w-full max-w-[1040px]">
      <div className="shadow-slate-900/12 rounded-xl border border-slate-200 bg-white/90 p-1.5 shadow-2xl backdrop-blur-md sm:p-2">
        <img
          src="/images/home-dashboard.png"
          alt="智评 EduReview 首页仪表盘预览"
          className="aspect-[16/9] w-full rounded-lg object-cover object-left-top"
        />
      </div>
    </div>
  );
}

function FeatureTile({ icon: Icon, title, description, tone }: FeatureCard) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-7 shadow-sm">
      <div className="flex items-start gap-5">
        <div
          className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-md ${tone} text-white`}
        >
          <Icon className="h-6 w-6" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-slate-950">{title}</h3>
          <p className="mt-2 text-sm leading-6 text-slate-600">{description}</p>
        </div>
      </div>
    </div>
  );
}

function ProductFeature({ icon: Icon, title, description, tone }: FeatureCard) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-6">
      <div
        className={`mb-5 flex h-11 w-11 items-center justify-center rounded-md ${tone}`}
      >
        <Icon className="h-5 w-5" />
      </div>
      <h3 className="text-lg font-bold text-slate-950">{title}</h3>
      <p className="mt-3 text-sm leading-7 text-slate-600">{description}</p>
    </div>
  );
}

function SectionHeader({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <div className="mx-auto max-w-3xl text-center">
      <div className="text-sm font-bold text-blue-600">{eyebrow}</div>
      <h2 className="mt-3 text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
        {title}
      </h2>
      <p className="mt-4 leading-7 text-slate-600">{description}</p>
    </div>
  );
}
