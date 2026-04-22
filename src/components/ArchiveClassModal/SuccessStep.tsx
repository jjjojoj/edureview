import { Check, Sparkles } from "lucide-react";

interface SuccessStepProps {
  isPromote: boolean;
  successData: any;
  onClose: () => void;
}

export function SuccessStep({ isPromote, successData, onClose }: SuccessStepProps) {
  return (
    <div className="px-8 py-8 text-center">
      <div className="w-20 h-20 bg-gradient-to-br from-green-500 to-emerald-600 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-glow-lg animate-scale-in">
        <Check className="w-10 h-10 text-white" />
      </div>

      <h3 className="text-2xl font-bold text-gray-900 mb-2 animate-slide-up">
        {isPromote ? "升级成功！" : "归档成功！"}
      </h3>

      <p className="text-gray-600 mb-6 animate-slide-up" style={{ animationDelay: "0.1s" }}>
        {isPromote
          ? `班级已成功升级。${successData?.movedStudents?.length || 0} 位学生已转移到新班级。`
          : `班级已成功归档。已生成 ${successData?.archivedClass?.studentReportsCount || 0} 份学生报告和班级分析报告。`}
      </p>

      {isPromote && successData?.newClass && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-6 animate-slide-up" style={{ animationDelay: "0.2s" }}>
          <div className="text-sm text-green-800">
            <p className="font-semibold mb-2">新班级信息：</p>
            <p>班级名称: {successData.newClass.name}</p>
            <p>邀请码: <span className="font-mono font-bold">{successData.newClass.invitationCode}</span></p>
            <p>学生数量: {successData.newClass.studentCount} 人</p>
          </div>
        </div>
      )}

      <button
        onClick={onClose}
        className="btn-primary w-full group animate-slide-up"
        style={{ animationDelay: "0.3s" }}
      >
        完成
        <Sparkles className="w-5 h-5 ml-2 group-hover:rotate-12 transition-transform" />
      </button>
    </div>
  );
}
