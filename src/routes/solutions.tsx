import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import {
  BookOpen,
  Building2,
  Check,
  ClipboardCheck,
  GraduationCap,
  LineChart,
  MessageSquareText,
  Users,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import {
  MarketingSectionHeader,
  MarketingShell,
} from "~/components/marketing/MarketingShell";

export const Route = createFileRoute("/solutions")({
  component: SolutionsPage,
});

type SolutionKey = "k12" | "higher" | "vocational" | "institution";

type Solution = {
  key: SolutionKey;
  tab: string;
  eyebrow: string;
  title: string;
  description: string;
  image: string;
  bullets: string[];
  workflow: Array<{ label: string; value: string }>;
  benefits: Array<{ icon: LucideIcon; title: string; text: string }>;
  scenarios: Array<{ icon: LucideIcon; title: string; text: string }>;
};

const solutions: Solution[] = [
  {
    key: "k12",
    tab: "K12 教育",
    eyebrow: "K12 教育解决方案",
    title: "覆盖作业、试卷、错题和家校沟通的完整闭环",
    description:
      "教师上传日常作业和阶段测验，系统自动生成班级趋势、知识点掌握和学生画像，帮助老师更快定位下一节课该讲什么。",
    image:
      "https://images.unsplash.com/photo-1509062522246-3755977927d7?auto=format&fit=crop&w=1400&q=80",
    bullets: [
      "作业批改结果自动沉淀到学生画像",
      "错题按知识点、题型和学生分层归因",
      "班级报告可用于课堂复盘与家校沟通",
    ],
    workflow: [
      { label: "输入", value: "作业 / 试卷" },
      { label: "分析", value: "错题与知识点" },
      { label: "输出", value: "课堂复盘报告" },
    ],
    benefits: [
      {
        icon: GraduationCap,
        title: "提升教学效率",
        text: "批改、归因和报告自动串联，减少重复整理。",
      },
      {
        icon: LineChart,
        title: "精准学情诊断",
        text: "从错题反推学生薄弱知识点和班级共性问题。",
      },
      {
        icon: Users,
        title: "个性化教学",
        text: "按学生、分层和知识点安排跟进动作。",
      },
      {
        icon: MessageSquareText,
        title: "家校协同育人",
        text: "用结构化报告降低沟通成本。",
      },
    ],
    scenarios: [
      {
        icon: ClipboardCheck,
        title: "课堂作业场景",
        text: "围绕日常作业快速完成识别、评分、反馈和错题沉淀。",
      },
      {
        icon: BookOpen,
        title: "阶段考试场景",
        text: "对试卷结果做知识点归因，辅助下一轮复习计划。",
      },
      {
        icon: Building2,
        title: "年级教研场景",
        text: "按班级和知识模块聚合问题，服务集体备课和复盘。",
      },
    ],
  },
  {
    key: "higher",
    tab: "高等教育",
    eyebrow: "高等教育解决方案",
    title: "让课程作业、测验和学习反馈形成持续改进依据",
    description:
      "面向高校课程教学，把课程作业、小测和阶段考核转化为可追踪的学习表现数据，辅助教师发现课程理解难点。",
    image:
      "https://images.unsplash.com/photo-1523580846011-d3a5bc25702b?auto=format&fit=crop&w=1400&q=80",
    bullets: [
      "按课程单元沉淀学生掌握情况",
      "从主观题反馈中发现共性误区",
      "为课程复盘和教学改进提供材料",
    ],
    workflow: [
      { label: "输入", value: "课程作业" },
      { label: "分析", value: "单元掌握" },
      { label: "输出", value: "课程改进建议" },
    ],
    benefits: [
      {
        icon: BookOpen,
        title: "课程单元复盘",
        text: "把作业与测验结果沉淀到课程章节维度。",
      },
      {
        icon: LineChart,
        title: "过程性评价",
        text: "关注持续学习表现，而不只看一次考试分数。",
      },
      {
        icon: MessageSquareText,
        title: "反馈更具体",
        text: "把常见错误转化为讲评重点和补充材料方向。",
      },
      {
        icon: Users,
        title: "学习支持",
        text: "识别需要额外辅导或学习资源支持的学生群体。",
      },
    ],
    scenarios: [
      {
        icon: ClipboardCheck,
        title: "课程作业分析",
        text: "围绕章节作业发现学生理解偏差和高频错误。",
      },
      {
        icon: LineChart,
        title: "过程表现追踪",
        text: "观察作业、小测和阶段任务之间的表现变化。",
      },
      {
        icon: BookOpen,
        title: "课程质量改进",
        text: "为教学总结、课程复盘和资源补充提供依据。",
      },
    ],
  },
  {
    key: "vocational",
    tab: "职业教育",
    eyebrow: "职业教育解决方案",
    title: "围绕技能训练、任务考核和证书备考做学习诊断",
    description:
      "面向职业院校和技能培训场景，把任务练习、理论测验和实训反馈纳入同一套分析流程，帮助教师判断学生是否真正掌握关键技能点。",
    image:
      "https://images.unsplash.com/photo-1581091870622-1e7e196fd816?auto=format&fit=crop&w=1400&q=80",
    bullets: [
      "按技能模块归因理论与实操薄弱点",
      "沉淀任务训练过程中的常见失误",
      "辅助证书备考和阶段性技能达标复盘",
    ],
    workflow: [
      { label: "输入", value: "任务训练" },
      { label: "分析", value: "技能模块" },
      { label: "输出", value: "补训重点" },
    ],
    benefits: [
      {
        icon: ClipboardCheck,
        title: "任务化评价",
        text: "围绕实训任务和理论测验组织学习反馈。",
      },
      {
        icon: Building2,
        title: "技能模块归因",
        text: "把错误映射到具体技能点和操作环节。",
      },
      {
        icon: LineChart,
        title: "阶段达标追踪",
        text: "跟踪学生从练习到达标的变化。",
      },
      {
        icon: BookOpen,
        title: "证书备考支持",
        text: "根据薄弱点安排有针对性的复习和训练。",
      },
    ],
    scenarios: [
      {
        icon: ClipboardCheck,
        title: "实训任务复盘",
        text: "整理学生在任务步骤、知识应用和规范表达中的问题。",
      },
      {
        icon: BookOpen,
        title: "理论测验诊断",
        text: "把理论题错误归因到技能模块和知识点。",
      },
      {
        icon: LineChart,
        title: "补训计划制定",
        text: "按班级共性问题和个人薄弱项安排补训重点。",
      },
    ],
  },
  {
    key: "institution",
    tab: "教育机构",
    eyebrow: "教育机构解决方案",
    title: "支持多班级、多教师协作的学情管理与服务交付",
    description:
      "面向培训机构和校外辅导团队，帮助教务、教师和负责人统一查看班级学习进展、重点学生和阶段报告。",
    image:
      "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=1400&q=80",
    bullets: [
      "多班级学情汇总，便于教务统筹",
      "重点学生自动标记，方便持续跟进",
      "阶段报告服务家长沟通和续班复盘",
    ],
    workflow: [
      { label: "输入", value: "班级数据" },
      { label: "分析", value: "重点学生" },
      { label: "输出", value: "阶段报告" },
    ],
    benefits: [
      {
        icon: Building2,
        title: "多班级管理",
        text: "让负责人快速了解不同班级的教学进展。",
      },
      {
        icon: Users,
        title: "重点学生跟进",
        text: "把需要关注的学生、问题和跟进动作放在一起。",
      },
      {
        icon: MessageSquareText,
        title: "家长沟通材料",
        text: "用结构化报告解释学习变化和后续计划。",
      },
      {
        icon: LineChart,
        title: "服务质量复盘",
        text: "沉淀课程效果、班级变化和教师交付情况。",
      },
    ],
    scenarios: [
      {
        icon: Building2,
        title: "教务运营看板",
        text: "按班级和教师查看作业完成、薄弱点和报告进度。",
      },
      {
        icon: Users,
        title: "学生分层跟进",
        text: "为不同学习状态的学生生成差异化跟进建议。",
      },
      {
        icon: MessageSquareText,
        title: "阶段沟通报告",
        text: "为家长会、续班沟通和阶段反馈准备清晰材料。",
      },
    ],
  },
];

function SolutionsPage() {
  const [activeKey, setActiveKey] = useState<SolutionKey>("k12");
  const activeSolution =
    solutions.find((solution) => solution.key === activeKey) ?? solutions[0]!;

  return (
    <MarketingShell active="solutions">
      <main className="bg-white py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <MarketingSectionHeader
            eyebrow="解决方案"
            title="为不同教育场景提供 AI 能力"
            description="从一线课堂到学校教研，围绕作业数据沉淀可复用的教学洞察。"
          />

          <div className="mt-8 flex flex-wrap justify-center gap-2">
            {solutions.map((solution) => {
              const isActive = solution.key === activeKey;
              return (
                <button
                  key={solution.key}
                  type="button"
                  aria-pressed={isActive}
                  onClick={() => setActiveKey(solution.key)}
                  className={`rounded-md px-5 py-2 text-sm font-bold transition ${
                    isActive
                      ? "bg-blue-600 text-white shadow-sm shadow-blue-600/20"
                      : "bg-slate-50 text-slate-600 ring-1 ring-slate-200 hover:bg-white hover:text-blue-600"
                  }`}
                >
                  {solution.tab}
                </button>
              );
            })}
          </div>

          <div className="mt-10 grid overflow-hidden rounded-lg border border-slate-200 bg-white lg:grid-cols-[0.9fr_1.1fr]">
            <div
              className="relative min-h-[360px] bg-cover bg-center"
              style={{ backgroundImage: `url('${activeSolution.image}')` }}
            >
              <div className="absolute inset-0 bg-slate-950/10" />
              <div className="absolute bottom-5 left-5 rounded-md bg-white/90 px-3 py-2 text-sm font-bold text-slate-900 shadow-sm backdrop-blur">
                {activeSolution.tab}
              </div>
            </div>
            <div className="p-8 lg:p-10">
              <div className="text-sm font-bold text-blue-600">
                {activeSolution.eyebrow}
              </div>
              <h2 className="mt-3 text-2xl font-bold tracking-tight text-slate-950">
                {activeSolution.title}
              </h2>
              <p className="mt-4 leading-7 text-slate-600">
                {activeSolution.description}
              </p>
              <ul className="mt-6 space-y-3">
                {activeSolution.bullets.map((item) => (
                  <li key={item} className="flex items-center gap-3">
                    <Check className="h-5 w-5 text-blue-600" />
                    <span className="text-sm font-semibold text-slate-700">
                      {item}
                    </span>
                  </li>
                ))}
              </ul>

              <div className="mt-8 grid gap-3 sm:grid-cols-3">
                {activeSolution.workflow.map((item) => (
                  <div key={item.label} className="rounded-md bg-slate-50 p-4">
                    <div className="text-xs font-bold text-slate-400">
                      {item.label}
                    </div>
                    <div className="mt-2 text-base font-bold text-slate-950">
                      {item.value}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-8 grid gap-5 md:grid-cols-4">
            {activeSolution.benefits.map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.title}
                  className="rounded-lg border border-slate-200 bg-white p-6"
                >
                  <Icon className="h-6 w-6 text-blue-600" />
                  <h3 className="mt-4 font-bold text-slate-950">
                    {item.title}
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    {item.text}
                  </p>
                </div>
              );
            })}
          </div>

          <div className="mt-10 grid gap-5 md:grid-cols-3">
            {activeSolution.scenarios.map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.title}
                  className="rounded-lg border border-slate-200 bg-slate-50 p-6"
                >
                  <Icon className="h-6 w-6 text-blue-600" />
                  <h3 className="mt-4 font-bold text-slate-950">
                    {item.title}
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    {item.text}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </main>
    </MarketingShell>
  );
}
