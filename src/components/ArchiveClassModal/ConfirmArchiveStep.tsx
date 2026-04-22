import { Dialog } from "@headlessui/react";
import { X, Archive, AlertTriangle } from "lucide-react";

interface ConfirmArchiveStepProps {
  className: string;
  onBack: () => void;
  onConfirm: () => void;
  onClose: () => void;
}

export function ConfirmArchiveStep({
  className,
  onBack,
  onConfirm,
  onClose,
}: ConfirmArchiveStepProps) {
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
                确认归档
              </Dialog.Title>
              <p className="text-sm text-gray-500 mt-1">最后确认归档操作</p>
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
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 mb-6">
          <div className="flex items-start">
            <AlertTriangle className="w-6 h-6 text-red-600 mr-3 mt-0.5 flex-shrink-0" />
            <div>
              <h3 className="font-bold text-red-900 mb-2">请仔细确认以下操作：</h3>
              <ul className="space-y-2 text-sm text-red-800">
                <li>• 班级 "{className}" 将被标记为已归档</li>
                <li>• 将生成最终的学生总结报告和班级分析报告</li>
                <li>• 原始作业和考试图片将被删除以节省存储空间</li>
                <li>• 班级将变为只读状态，无法添加新内容</li>
                <li>• <strong>此操作无法撤销</strong></li>
              </ul>
            </div>
          </div>
        </div>

        <div className="flex space-x-3">
          <button
            onClick={onBack}
            className="btn-secondary flex-1"
          >
            返回
          </button>
          <button
            onClick={onConfirm}
            className="bg-red-600 hover:bg-red-700 text-white font-semibold py-3 px-6 rounded-xl transition-all flex-1 group"
          >
            确认归档
            <Archive className="w-4 h-4 ml-2" />
          </button>
        </div>
      </div>
    </>
  );
}
