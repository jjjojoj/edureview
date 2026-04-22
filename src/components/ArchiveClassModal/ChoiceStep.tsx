import { Dialog } from "@headlessui/react";
import {
  X,
  Archive,
  GraduationCap,
  Check,
  AlertTriangle,
  BookOpen,
  FileText,
  ArrowRight,
} from "lucide-react";

interface ChoiceStepProps {
  className: string;
  archiveChoice: "archive-only" | "promote";
  onChoiceChange: (choice: "archive-only" | "promote") => void;
  onContinue: (choice: "archive-only" | "promote") => void;
  onClose: () => void;
}

export function ChoiceStep({
  className,
  archiveChoice,
  onChoiceChange,
  onContinue,
  onClose,
}: ChoiceStepProps) {
  return (
    <>
      <div className="px-8 pt-8 pb-6 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-red-600 rounded-2xl flex items-center justify-center mr-4 shadow-glow">
              <Archive className="w-6 h-6 text-white" />
            </div>
            <div className="text-left">
              <Dialog.Title className="text-xl font-bold text-gray-900">
                结束学年
              </Dialog.Title>
              <p className="text-sm text-gray-500 mt-1">为 "{className}" 班级选择处理方式</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 rounded-xl hover:bg-gray-100 transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="px-8 py-6">
        <div className="mb-6">
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
            <div className="flex items-center">
              <AlertTriangle className="w-5 h-5 text-amber-600 mr-2" />
              <p className="text-sm text-amber-800">
                <strong>重要提醒：</strong> 归档班级将生成最终报告并将其设为只读状态。您将无法再添加新的作业、考试或学生。
              </p>
            </div>
          </div>

          <p className="text-gray-600 mb-6">
            归档过程将自动生成两类报告：
          </p>

          <ul className="space-y-2 text-sm text-gray-600 mb-8">
            <li className="flex items-start">
              <FileText className="w-4 h-4 text-blue-600 mr-2 mt-0.5 flex-shrink-0" />
              <span><strong>学生个人总结报告：</strong> 每位学生的学年表现总结，包括成绩、优势、需要改进的地方和常见错误分析</span>
            </li>
            <li className="flex items-start">
              <BookOpen className="w-4 h-4 text-green-600 mr-2 mt-0.5 flex-shrink-0" />
              <span><strong>班级分析报告：</strong> 整体班级表现分析，包括平均分、完成率和学习进展趋势</span>
            </li>
          </ul>
        </div>

        <div className="space-y-4">
          <div
            className={`card-interactive p-6 cursor-pointer transition-all ${
              archiveChoice === "archive-only" ? "ring-2 ring-blue-500 bg-blue-50" : "hover:bg-gray-50"
            }`}
            onClick={() => onChoiceChange("archive-only")}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-10 h-10 bg-gradient-to-br from-gray-500 to-gray-600 rounded-xl flex items-center justify-center mr-4">
                  <Archive className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 mb-1">仅归档班级</h3>
                  <p className="text-sm text-gray-600">我不会继续教这个班级</p>
                </div>
              </div>
              <div className={`w-4 h-4 rounded-full border-2 ${
                archiveChoice === "archive-only" ? "border-blue-500 bg-blue-500" : "border-gray-300"
              }`}>
                {archiveChoice === "archive-only" && <Check className="w-3 h-3 text-white" />}
              </div>
            </div>
          </div>

          <div
            className={`card-interactive p-6 cursor-pointer transition-all ${
              archiveChoice === "promote" ? "ring-2 ring-green-500 bg-green-50" : "hover:bg-gray-50"
            }`}
            onClick={() => onChoiceChange("promote")}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center mr-4">
                  <GraduationCap className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 mb-1">升级到下一年级</h3>
                  <p className="text-sm text-gray-600">我会继续教这些学生</p>
                </div>
              </div>
              <div className={`w-4 h-4 rounded-full border-2 ${
                archiveChoice === "promote" ? "border-green-500 bg-green-500" : "border-gray-300"
              }`}>
                {archiveChoice === "promote" && <Check className="w-3 h-3 text-white" />}
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 flex space-x-3">
          <button onClick={onClose} className="btn-secondary flex-1">
            取消
          </button>
          <button
            onClick={() => onContinue(archiveChoice)}
            className="btn-primary flex-1 group"
          >
            继续
            <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </div>
    </>
  );
}
