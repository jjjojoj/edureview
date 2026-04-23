import { createFileRoute } from "@tanstack/react-router";
import {
  BarChart3,
  Brain,
  CheckCircle2,
  ClipboardCheck,
  FileText,
  Layers,
  PenTool,
  ShieldCheck,
  Target,
  Users,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import {
  MarketingSectionHeader,
  MarketingShell,
} from "~/components/marketing/MarketingShell";

export const Route = createFileRoute("/features")({
  component: FeaturesPage,
});

const features: Array<{
  icon: LucideIcon;
  title: string;
  description: string;
  tone: string;
}> = [
  {
    icon: Brain,
    title: "AI 智能批改",
    description: "自动识别作业与试卷内容，生成评分、反馈和可复盘的分析结果。",
    tone: "bg-emerald-50 text-emerald-700",
  },
  {
    icon: BarChart3,
    title: "学情趋势分析",
    description: "沉淀班级平均、优秀率、低分率和完成率，快速判断教学节奏。",
    tone: "bg-blue-50 text-blue-700",
  },
  {
    icon: Target,
    title: "错因归类",
    description: "按知识点、题型和学生自动聚合错题，定位需要补强的环节。",
    tone: "bg-rose-50 text-rose-700",
  },
  {
    icon: PenTool,
    title: "个性化练习",
    description: "基于错题库生成针对性练习，让巩固训练更贴合学生问题。",
    tone: "bg-indigo-50 text-indigo-700",
  },
  {
    icon: Users,
    title: "班级管理",
    description: "管理班级、学生分组、重点关注对象和学生成长档案。",
    tone: "bg-cyan-50 text-cyan-700",
  },
  {
    icon: FileText,
    title: "教学报告生成",
    description: "生成班级报告、学生报告和阶段分析，服务课堂复盘与家校沟通。",
    tone: "bg-amber-50 text-amber-700",
  },
];

function FeaturesPage() {
  return (
    <MarketingShell active="features">
      <main>
        <section className="bg-white py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <MarketingSectionHeader
              eyebrow="核心功能特性"
              title="用 AI 串联作业、试卷、错题与报告"
              description="围绕一线教师每天都要处理的批改、分析、复习和沟通场景，让数据自然进入教学决策。"
            />

            <div className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {features.map((feature) => {
                const Icon = feature.icon;
                return (
                  <div
                    key={feature.title}
                    className="rounded-lg border border-slate-200 bg-white p-7"
                  >
                    <div
                      className={`mb-5 flex h-12 w-12 items-center justify-center rounded-md ${feature.tone}`}
                    >
                      <Icon className="h-6 w-6" />
                    </div>
                    <h2 className="text-lg font-bold text-slate-950">
                      {feature.title}
                    </h2>
                    <p className="mt-3 text-sm leading-7 text-slate-600">
                      {feature.description}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        <section className="bg-slate-50 py-20">
          <div className="mx-auto grid max-w-7xl gap-6 px-4 sm:px-6 lg:grid-cols-3 lg:px-8">
            {[
              {
                icon: ClipboardCheck,
                title: "批改后自动进入分析",
                text: "每次作业结果都会进入班级趋势、学生画像和知识点图谱。",
              },
              {
                icon: Layers,
                title: "跨模块数据互通",
                text: "作业、试卷、错题、报告不再割裂，教师不用重复整理表格。",
              },
              {
                icon: ShieldCheck,
                title: "面向教学场景安全设计",
                text: "围绕教师账号、班级权限和学生数据保护进行产品设计。",
              },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.title}
                  className="rounded-lg border border-slate-200 bg-white p-7"
                >
                  <Icon className="h-7 w-7 text-blue-600" />
                  <h3 className="mt-5 text-lg font-bold text-slate-950">
                    {item.title}
                  </h3>
                  <p className="mt-3 text-sm leading-7 text-slate-600">
                    {item.text}
                  </p>
                </div>
              );
            })}
          </div>
        </section>
      </main>
    </MarketingShell>
  );
}
