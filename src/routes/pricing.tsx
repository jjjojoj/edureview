import { createFileRoute } from "@tanstack/react-router";
import { Check } from "lucide-react";
import {
  MarketingSectionHeader,
  MarketingShell,
} from "~/components/marketing/MarketingShell";

export const Route = createFileRoute("/pricing")({
  component: PricingPage,
});

const plans = [
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
] as const;

function PricingPage() {
  return (
    <MarketingShell active="pricing">
      <main className="bg-white py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <MarketingSectionHeader
            eyebrow="定价方案"
            title="商业定价暂未开放"
            description="智评 EduReview 仍处于产品演示与内测阶段，暂不提供付费购买入口。你可以先通过演示环境查看完整流程。"
          />

          <div className="mt-10 grid gap-5 lg:grid-cols-3">
            {plans.map((plan) => (
              <div
                key={plan.name}
                className="relative rounded-lg border border-slate-200 bg-white p-6"
              >
                <span className="absolute right-4 top-4 rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-500">
                  暂未开放
                </span>
                <h2 className="text-lg font-bold text-slate-950">
                  {plan.name}
                </h2>
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
      </main>
    </MarketingShell>
  );
}
