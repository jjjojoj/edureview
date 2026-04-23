import { createFileRoute } from "@tanstack/react-router";
import { HelpCircle, Search, UserRound, Users, Wrench } from "lucide-react";
import {
  MarketingSectionHeader,
  MarketingShell,
} from "~/components/marketing/MarketingShell";

export const Route = createFileRoute("/help")({
  component: HelpPage,
});

function HelpPage() {
  const categories = [
    { icon: UserRound, title: "快速入门", text: "账号、班级、学生导入" },
    { icon: Users, title: "教师使用指南", text: "批改、分析、出题流程" },
    { icon: HelpCircle, title: "学生使用指南", text: "作业提交与反馈查看" },
    { icon: Wrench, title: "常见问题", text: "故障排查与数据说明" },
  ];
  const faqs = [
    "如何开始使用智评 EduReview？",
    "支持哪些类型的作业和试卷？",
    "批改结果可以导出吗？",
    "如何查看学生学情画像？",
    "可以邀请同校老师协作吗？",
    "遇到技术问题如何解决？",
  ];

  return (
    <MarketingShell active="help">
      <main>
        <section
          className="bg-cover bg-center py-20"
          style={{
            backgroundImage:
              "linear-gradient(90deg, rgba(248,250,252,.96), rgba(239,246,255,.92)), url('https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1800&q=80')",
          }}
        >
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <MarketingSectionHeader
              eyebrow="帮助中心"
              title="找到答案，快速上手智评 EduReview"
              description="搜索操作指南、常见问题和教学场景文档。"
            />
            <div className="mx-auto mt-8 flex max-w-2xl items-center gap-3 rounded-lg bg-white px-5 py-4 shadow-sm ring-1 ring-slate-200">
              <Search className="h-5 w-5 text-slate-400" />
              <span className="text-sm text-slate-400">搜索帮助文档...</span>
              <button className="ml-auto rounded-md bg-blue-600 px-4 py-2 text-sm font-bold text-white">
                搜索
              </button>
            </div>
          </div>
        </section>

        <section className="bg-white py-16">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid gap-5 md:grid-cols-4">
              {categories.map((item) => {
                const Icon = item.icon;
                return (
                  <div
                    key={item.title}
                    className="rounded-lg border border-slate-200 bg-white p-6"
                  >
                    <Icon className="h-6 w-6 text-blue-600" />
                    <h2 className="mt-4 font-bold text-slate-950">
                      {item.title}
                    </h2>
                    <p className="mt-2 text-sm text-slate-500">{item.text}</p>
                  </div>
                );
              })}
            </div>

            <div className="mt-12 rounded-lg border border-slate-200 bg-white p-6">
              <h2 className="text-xl font-bold text-slate-950">常见问题</h2>
              <div className="mt-6 divide-y divide-slate-100">
                {faqs.map((faq) => (
                  <button
                    key={faq}
                    className="flex w-full items-center justify-between py-4 text-left text-sm font-semibold text-slate-700"
                  >
                    {faq}
                    <span className="text-slate-300">›</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>
      </main>
    </MarketingShell>
  );
}
