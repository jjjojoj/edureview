import { useState } from "react";
import {
  ArrowDown,
  ArrowUp,
  ChevronRight,
  GraduationCap,
  Group,
  Heart,
  Mail,
  Search,
  Sparkles,
  Trash2,
  UserPlus,
  Users,
} from "lucide-react";
import { RightClickMenu, type ContextMenuItem } from "~/components/ContextMenu";

type SortField = "name" | "studentId" | "performance" | "potential";
type SortOrder = "asc" | "desc";

export interface ClassStudentRecord {
  id: number;
  name: string;
  email?: string | null;
  studentId?: string | null;
  specialAttention?: boolean;
  group?: { id: number; name: string } | null;
  _count: {
    assignments: number;
    exams: number;
    mistakes: number;
    examMistakes: number;
  };
}

interface ClassStudentsProps {
  students: ClassStudentRecord[];
  onStudentClick: (studentId: number) => void;
  onDeleteStudent: (student: ClassStudentRecord) => void;
  onSpecialAttention: (student: ClassStudentRecord) => void;
  onAddToGroup: (student: ClassStudentRecord) => void;
  onShowAddStudentModal: () => void;
}

export function ClassStudents({
  students,
  onStudentClick,
  onDeleteStudent,
  onSpecialAttention,
  onAddToGroup,
  onShowAddStudentModal,
}: ClassStudentsProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState<SortField>("name");
  const [sortOrder, setSortOrder] = useState<SortOrder>("asc");

  const handleSort = (newSortBy: SortField) => {
    if (sortBy === newSortBy) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
      return;
    }
    setSortBy(newSortBy);
    setSortOrder("asc");
  };

  const getContextMenuItems = (
    student: ClassStudentRecord,
  ): ContextMenuItem[] => [
    {
      label: "删除学生",
      icon: <Trash2 className="h-4 w-4" />,
      onClick: () => onDeleteStudent(student),
      className: "text-red-700 hover:bg-red-50",
    },
    {
      label: student.specialAttention ? "取消特别关注" : "特别关注",
      icon: <Heart className="h-4 w-4" />,
      onClick: () => onSpecialAttention(student),
      className: "text-pink-700 hover:bg-pink-50",
    },
    {
      label: "添加到小组",
      icon: <Group className="h-4 w-4" />,
      onClick: () => onAddToGroup(student),
      className: "text-blue-700 hover:bg-blue-50",
    },
  ];

  const filteredAndSortedStudents = students
    .filter(
      (student) =>
        student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (student.email &&
          student.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (student.studentId &&
          student.studentId.toLowerCase().includes(searchTerm.toLowerCase())),
    )
    .sort((a, b) => {
      let comparison = 0;

      switch (sortBy) {
        case "name":
          comparison = a.name.localeCompare(b.name, "zh-CN");
          break;
        case "studentId": {
          const aId = a.studentId || "";
          const bId = b.studentId || "";
          const aNum = Number.parseInt(aId, 10);
          const bNum = Number.parseInt(bId, 10);
          if (!Number.isNaN(aNum) && !Number.isNaN(bNum)) {
            comparison = aNum - bNum;
          } else {
            comparison = aId.localeCompare(bId, "zh-CN");
          }
          break;
        }
        case "performance":
          comparison =
            a._count.assignments +
            a._count.exams -
            (b._count.assignments + b._count.exams);
          break;
        case "potential":
          comparison =
            b._count.mistakes +
            b._count.examMistakes -
            (a._count.mistakes + a._count.examMistakes);
          break;
      }

      return sortOrder === "asc" ? comparison : -comparison;
    });

  return (
    <section className="rounded-lg border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-200 px-5 py-5">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                <Users className="h-5 w-5" />
              </span>
              <div>
                <h3 className="text-base font-bold text-slate-950">班级学生</h3>
                <p className="mt-1 text-xs font-medium text-slate-500">
                  搜索、分组、重点关注和学生详情都在这里完成。
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-3 xl:flex-row xl:items-center">
            <div className="relative min-w-60">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="搜索学生姓名、学号或邮箱"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                className="h-10 w-full rounded-lg border border-slate-200 bg-white pl-9 pr-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <SortButton
                label="姓名"
                active={sortBy === "name"}
                sortOrder={sortOrder}
                onClick={() => handleSort("name")}
              />
              <SortButton
                label="学号"
                active={sortBy === "studentId"}
                sortOrder={sortOrder}
                onClick={() => handleSort("studentId")}
              />
              <SortButton
                label="表现"
                active={sortBy === "performance"}
                sortOrder={sortOrder}
                onClick={() => handleSort("performance")}
              />
              <button
                onClick={onShowAddStudentModal}
                className="inline-flex h-10 items-center gap-2 rounded-lg bg-blue-600 px-3 text-sm font-semibold text-white transition hover:bg-blue-700"
              >
                <UserPlus className="h-4 w-4" />
                添加学生
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="p-5">
        {filteredAndSortedStudents.length > 0 ? (
          <div className="grid grid-cols-1 gap-3 xl:grid-cols-2">
            {filteredAndSortedStudents.map((student) => (
              <RightClickMenu
                key={student.id}
                items={getContextMenuItems(student)}
              >
                <button
                  type="button"
                  onClick={() => onStudentClick(student.id)}
                  className="group w-full rounded-xl border border-slate-200 bg-slate-50/70 p-4 text-left transition hover:border-blue-200 hover:bg-blue-50/60"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex min-w-0 items-start gap-3">
                      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-sm font-bold text-white shadow-sm shadow-blue-600/20">
                        {student.name.slice(0, 1)}
                      </span>
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="truncate text-sm font-bold text-slate-900">
                            {student.name}
                          </span>
                          {student.specialAttention ? (
                            <span className="rounded-full bg-orange-50 px-2 py-0.5 text-xs font-bold text-orange-600">
                              关注
                            </span>
                          ) : null}
                          {student.group ? (
                            <span className="rounded-full bg-blue-50 px-2 py-0.5 text-xs font-bold text-blue-600">
                              {student.group.name}
                            </span>
                          ) : null}
                        </div>

                        <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-slate-500">
                          <span className="inline-flex items-center gap-1">
                            <GraduationCap className="h-3.5 w-3.5" />
                            {student.studentId || "暂无学号"}
                          </span>
                          {student.email ? (
                            <span className="inline-flex items-center gap-1 truncate">
                              <Mail className="h-3.5 w-3.5" />
                              {student.email}
                            </span>
                          ) : null}
                        </div>
                      </div>
                    </div>

                    <ChevronRight className="h-4 w-4 shrink-0 text-slate-300 transition group-hover:translate-x-1 group-hover:text-blue-500" />
                  </div>

                  <div className="mt-4 grid grid-cols-3 gap-3">
                    <MiniStat label="作业" value={student._count.assignments} />
                    <MiniStat label="试卷" value={student._count.exams} />
                    <MiniStat
                      label="错题"
                      value={
                        student._count.mistakes + student._count.examMistakes
                      }
                    />
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2 border-t border-slate-200 pt-4">
                    <button
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation();
                        onSpecialAttention(student);
                      }}
                      className={`inline-flex h-9 items-center gap-1.5 rounded-lg px-3 text-xs font-semibold transition ${
                        student.specialAttention
                          ? "bg-orange-50 text-orange-600 hover:bg-orange-100"
                          : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                      }`}
                    >
                      <Heart className="h-3.5 w-3.5" />
                      {student.specialAttention ? "取消关注" : "重点关注"}
                    </button>
                    <button
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation();
                        onAddToGroup(student);
                      }}
                      className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-slate-100 px-3 text-xs font-semibold text-slate-600 transition hover:bg-slate-200"
                    >
                      <Group className="h-3.5 w-3.5" />
                      {student.group ? "调整分组" : "加入小组"}
                    </button>
                    <button
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation();
                        onDeleteStudent(student);
                      }}
                      className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-red-50 px-3 text-xs font-semibold text-red-600 transition hover:bg-red-100"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      删除
                    </button>
                  </div>
                </button>
              </RightClickMenu>
            ))}
          </div>
        ) : students.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/80 px-6 py-12 text-center">
            <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
              <Users className="h-8 w-8" />
            </span>
            <h4 className="mt-5 text-xl font-bold text-slate-950">
              还没有学生
            </h4>
            <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-slate-500">
              先补齐班级学生名单，后续作业上传、学情分析和学生画像才会逐步完整。
            </p>
            <button
              onClick={onShowAddStudentModal}
              className="mt-6 inline-flex h-11 items-center rounded-xl bg-blue-600 px-5 text-sm font-semibold text-white transition hover:bg-blue-700"
            >
              <UserPlus className="mr-2 h-4 w-4" />
              添加学生
              <Sparkles className="ml-2 h-4 w-4" />
            </button>
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/80 px-6 py-10 text-center">
            <Search className="mx-auto h-8 w-8 text-slate-400" />
            <p className="mt-3 text-sm font-medium text-slate-600">
              没有找到匹配“{searchTerm}”的学生
            </p>
            <button
              onClick={() => setSearchTerm("")}
              className="mt-2 text-sm font-semibold text-blue-600 transition hover:text-blue-700"
            >
              清除搜索
            </button>
          </div>
        )}
      </div>
    </section>
  );
}

function SortButton({
  label,
  active,
  sortOrder,
  onClick,
}: {
  label: string;
  active: boolean;
  sortOrder: SortOrder;
  onClick: () => void;
}) {
  const SortIcon = sortOrder === "asc" ? ArrowUp : ArrowDown;

  return (
    <button
      onClick={onClick}
      className={`inline-flex h-10 items-center gap-1 rounded-lg px-3 text-sm font-semibold transition ${
        active
          ? "bg-blue-50 text-blue-600 ring-1 ring-blue-100"
          : "bg-slate-100 text-slate-500 hover:text-slate-900"
      }`}
    >
      {label}
      {active ? <SortIcon className="h-3 w-3" /> : null}
    </button>
  );
}

function MiniStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg bg-white px-3 py-3 ring-1 ring-slate-100">
      <div className="text-xs font-medium text-slate-500">{label}</div>
      <div className="mt-1 text-base font-bold text-slate-950">{value}</div>
    </div>
  );
}
