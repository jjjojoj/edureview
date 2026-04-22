import { Loader2 } from "lucide-react";

interface ProcessingStepProps {
  isPromote: boolean;
}

export function ProcessingStep({ isPromote }: ProcessingStepProps) {
  return (
    <div className="px-8 py-12 text-center">
      <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-glow-lg">
        <Loader2 className="w-10 h-10 text-white animate-spin" />
      </div>
      <h3 className="text-xl font-bold text-gray-900 mb-2">
        {isPromote ? "正在升级班级..." : "正在归档班级..."}
      </h3>
      <p className="text-gray-600 mb-4">
        {isPromote
          ? "正在创建新班级并转移学生，请稍候..."
          : "正在生成最终报告并归档班级，请稍候..."}
      </p>
      <div className="text-sm text-gray-500">
        此过程可能需要几分钟时间，请不要关闭窗口
      </div>
    </div>
  );
}
