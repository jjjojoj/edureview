import { Dialog } from "@headlessui/react";
import { X, GraduationCap, ArrowRight } from "lucide-react";

interface ConfirmPromoteStepProps {
  className: string;
  newClassName: string;
  newGrade: string;
  onBack: () => void;
  onConfirm: () => void;
  onClose: () => void;
}

export function ConfirmPromoteStep({
  className,
  newClassName,
  newGrade,
  onBack,
  onConfirm,
  onClose,
}: ConfirmPromoteStepProps) {
  return (
    <>
      <div className="px-8 pt-8 pb-6 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center mr-4 shadow-glow">
              <GraduationCap className="w-6 h-6 text-white" />
            </div>
            <div className="text-left">
              <Dialog.Title className="text-xl font-bold text-gray-900">
                确认升级
              </Dialog.Title>
              <p className="text-sm text-gray-500 mt-1">最后确认升级操作</p>
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
        <div className="bg-green-50 border border-green-200 rounded-xl p-6 mb-6">
          <div className="flex items-start">
            <GraduationCap className="w-6 h-6 text-green-600 mr-3 mt-0.5 flex-shrink-0" />
            <div>
              <h3 className="font-bold text-green-900 mb-2">升级操作确认：</h3>
              <ul className="space-y-2 text-sm text-green-800">
                <li>• 当前班级 "{className}" 将被归档</li>
                <li>• 新班级 "{newClassName}" 将被创建</li>
                <li>• 所有学生将升级到 "{newGrade}"</li>
                <li>• 将生成当前班级的最终报告</li>
                <li>• 新班级将获得新的邀请码</li>
                <li>• 学生的历史记录将保留在归档班级中</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="flex space-x-3">
          <button
            onClick={onBack}
            className="btn-secondary flex-1"
          >
            返回修改
          </button>
          <button
            onClick={onConfirm}
            className="btn-primary flex-1 group"
          >
            确认升级
            <GraduationCap className="w-4 h-4 ml-2" />
          </button>
        </div>
      </div>
    </>
  );
}
