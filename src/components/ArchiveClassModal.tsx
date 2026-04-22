import { Fragment, useState } from "react";
import { Dialog, Transition } from "@headlessui/react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  X, 
  Archive, 
  GraduationCap, 
  Users, 
  ArrowRight,
  Loader2,
  Check,
  AlertTriangle,
  BookOpen,
  Calendar,
  FileText,
  Sparkles
} from "lucide-react";
import { useTRPC } from "~/trpc/react";
import { useAuthStore } from "~/stores/authStore";
import { useToast } from "~/components/Toast";
import { getErrorMessage } from "~/utils/trpcError";

const promoteClassSchema = z.object({
  newClassName: z.string().min(1, "新班级名称不能为空").max(100, "班级名称过长"),
  newGrade: z.string().min(1, "年级不能为空").max(20, "年级名称过长"),
});

type PromoteClassFormData = z.infer<typeof promoteClassSchema>;

interface ArchiveClassModalProps {
  isOpen: boolean;
  onClose: () => void;
  classId: number;
  className: string;
  onSuccess?: () => void;
}

export function ArchiveClassModal({ isOpen, onClose, classId, className, onSuccess }: ArchiveClassModalProps) {
  const [step, setStep] = useState<'choice' | 'promote-form' | 'confirm-archive' | 'confirm-promote' | 'processing' | 'success'>('choice');
  const [archiveChoice, setArchiveChoice] = useState<'archive-only' | 'promote'>('archive-only');
  const [successData, setSuccessData] = useState<any>(null);
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const { authToken } = useAuthStore();
  const toast = useToast();

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isValid },
  } = useForm<PromoteClassFormData>({
    resolver: zodResolver(promoteClassSchema),
    mode: 'onChange',
  });

  const concludeClassMutation = useMutation(trpc.concludeClass.mutationOptions());
  const promoteClassMutation = useMutation(trpc.promoteClass.mutationOptions());

  const watchedValues = watch();

  const handleChoice = (choice: 'archive-only' | 'promote') => {
    setArchiveChoice(choice);
    if (choice === 'archive-only') {
      setStep('confirm-archive');
    } else {
      setStep('promote-form');
    }
  };

  const handlePromoteFormSubmit = (data: PromoteClassFormData) => {
    setStep('confirm-promote');
  };

  const handleConfirmArchive = async () => {
    if (!authToken) {
      toast.error("未找到认证令牌，请重新登录");
      return;
    }

    setStep('processing');

    try {
      const result = await concludeClassMutation.mutateAsync({
        authToken,
        classId,
      });

      setSuccessData(result);
      setStep('success');
      
      // Invalidate queries to refresh the dashboard
      queryClient.invalidateQueries({ 
        queryKey: trpc.getTeacherClasses.queryKey({ authToken }) 
      });
      
      toast.success("班级已成功归档！");
      
      if (onSuccess) {
        onSuccess();
      }
    } catch (error: unknown) {
      toast.error(getErrorMessage(error));
      setStep('choice');
    }
  };

  const handleConfirmPromote = async () => {
    if (!authToken || !isValid) {
      toast.error("请检查表单信息");
      return;
    }

    setStep('processing');

    try {
      const result = await promoteClassMutation.mutateAsync({
        authToken,
        oldClassId: classId,
        newClassName: watchedValues.newClassName,
        newGrade: watchedValues.newGrade,
      });

      setSuccessData(result);
      setStep('success');
      
      // Invalidate queries to refresh the dashboard
      queryClient.invalidateQueries({ 
        queryKey: trpc.getTeacherClasses.queryKey({ authToken }) 
      });
      
      toast.success(`班级已成功升级到${watchedValues.newGrade}！`);
      
      if (onSuccess) {
        onSuccess();
      }
    } catch (error: unknown) {
      toast.error(getErrorMessage(error));
      setStep('choice');
    }
  };

  const handleClose = () => {
    setStep('choice');
    setArchiveChoice('archive-only');
    setSuccessData(null);
    reset();
    onClose();
  };

  const renderChoiceStep = () => (
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
            onClick={handleClose}
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
              archiveChoice === 'archive-only' ? 'ring-2 ring-blue-500 bg-blue-50' : 'hover:bg-gray-50'
            }`}
            onClick={() => setArchiveChoice('archive-only')}
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
                archiveChoice === 'archive-only' ? 'border-blue-500 bg-blue-500' : 'border-gray-300'
              }`}>
                {archiveChoice === 'archive-only' && <Check className="w-3 h-3 text-white" />}
              </div>
            </div>
          </div>

          <div 
            className={`card-interactive p-6 cursor-pointer transition-all ${
              archiveChoice === 'promote' ? 'ring-2 ring-green-500 bg-green-50' : 'hover:bg-gray-50'
            }`}
            onClick={() => setArchiveChoice('promote')}
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
                archiveChoice === 'promote' ? 'border-green-500 bg-green-500' : 'border-gray-300'
              }`}>
                {archiveChoice === 'promote' && <Check className="w-3 h-3 text-white" />}
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 flex space-x-3">
          <button
            onClick={handleClose}
            className="btn-secondary flex-1"
          >
            取消
          </button>
          <button
            onClick={() => handleChoice(archiveChoice)}
            className="btn-primary flex-1 group"
          >
            继续
            <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </div>
    </>
  );

  const renderPromoteFormStep = () => (
    <>
      <div className="px-8 pt-8 pb-6 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center mr-4 shadow-glow">
              <GraduationCap className="w-6 h-6 text-white" />
            </div>
            <div className="text-left">
              <Dialog.Title className="text-xl font-bold text-gray-900">
                升级班级
              </Dialog.Title>
              <p className="text-sm text-gray-500 mt-1">设置新学年的班级信息</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-2 text-gray-400 hover:text-gray-600 rounded-xl hover:bg-gray-100 transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit(handlePromoteFormSubmit)} className="px-8 py-6">
        <div className="space-y-6">
          <div className="animate-slide-up">
            <label htmlFor="newClassName" className="block text-sm font-semibold text-gray-700 mb-2">
              新班级名称 *
            </label>
            <input
              {...register("newClassName")}
              type="text"
              id="newClassName"
              className="form-input"
              placeholder="例如：八年级数学"
            />
            {errors.newClassName && (
              <p className="text-red-600 text-sm mt-2 animate-slide-down">{errors.newClassName.message}</p>
            )}
          </div>

          <div className="animate-slide-up" style={{ animationDelay: '0.1s' }}>
            <label htmlFor="newGrade" className="block text-sm font-semibold text-gray-700 mb-2">
              新年级 *
            </label>
            <input
              {...register("newGrade")}
              type="text"
              id="newGrade"
              className="form-input"
              placeholder="例如：八年级"
            />
            {errors.newGrade && (
              <p className="text-red-600 text-sm mt-2 animate-slide-down">{errors.newGrade.message}</p>
            )}
          </div>

          <div className="bg-green-50 border border-green-200 rounded-xl p-4 animate-slide-up" style={{ animationDelay: '0.2s' }}>
            <div className="flex items-start">
              <Users className="w-5 h-5 text-green-600 mr-2 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-green-800">
                <p className="font-semibold mb-1">升级过程将：</p>
                <ul className="space-y-1">
                  <li>• 创建新班级并生成新的邀请码</li>
                  <li>• 将所有学生转移到新班级</li>
                  <li>• 归档当前班级并生成最终报告</li>
                  <li>• 新班级将从零开始，不包含旧的作业和考试</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="flex space-x-3 animate-slide-up" style={{ animationDelay: '0.3s' }}>
            <button
              type="button"
              onClick={() => setStep('choice')}
              className="btn-secondary flex-1"
            >
              返回
            </button>
            <button
              type="submit"
              disabled={!isValid}
              className="btn-primary flex-1 group disabled:opacity-50 disabled:cursor-not-allowed"
            >
              确认升级
              <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </div>
      </form>
    </>
  );

  const renderConfirmArchiveStep = () => (
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
            onClick={handleClose}
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
            onClick={() => setStep('choice')}
            className="btn-secondary flex-1"
          >
            返回
          </button>
          <button
            onClick={handleConfirmArchive}
            className="bg-red-600 hover:bg-red-700 text-white font-semibold py-3 px-6 rounded-xl transition-all flex-1 group"
          >
            确认归档
            <Archive className="w-4 h-4 ml-2" />
          </button>
        </div>
      </div>
    </>
  );

  const renderConfirmPromoteStep = () => (
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
            onClick={handleClose}
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
                <li>• 新班级 "{watchedValues.newClassName}" 将被创建</li>
                <li>• 所有学生将升级到 "{watchedValues.newGrade}"</li>
                <li>• 将生成当前班级的最终报告</li>
                <li>• 新班级将获得新的邀请码</li>
                <li>• 学生的历史记录将保留在归档班级中</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="flex space-x-3">
          <button
            onClick={() => setStep('promote-form')}
            className="btn-secondary flex-1"
          >
            返回修改
          </button>
          <button
            onClick={handleConfirmPromote}
            className="btn-primary flex-1 group"
          >
            确认升级
            <GraduationCap className="w-4 h-4 ml-2" />
          </button>
        </div>
      </div>
    </>
  );

  const renderProcessingStep = () => (
    <div className="px-8 py-12 text-center">
      <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-glow-lg">
        <Loader2 className="w-10 h-10 text-white animate-spin" />
      </div>
      <h3 className="text-xl font-bold text-gray-900 mb-2">
        {archiveChoice === 'promote' ? '正在升级班级...' : '正在归档班级...'}
      </h3>
      <p className="text-gray-600 mb-4">
        {archiveChoice === 'promote' 
          ? '正在创建新班级并转移学生，请稍候...' 
          : '正在生成最终报告并归档班级，请稍候...'
        }
      </p>
      <div className="text-sm text-gray-500">
        此过程可能需要几分钟时间，请不要关闭窗口
      </div>
    </div>
  );

  const renderSuccessStep = () => (
    <div className="px-8 py-8 text-center">
      <div className="w-20 h-20 bg-gradient-to-br from-green-500 to-emerald-600 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-glow-lg animate-scale-in">
        <Check className="w-10 h-10 text-white" />
      </div>
      
      <h3 className="text-2xl font-bold text-gray-900 mb-2 animate-slide-up">
        {archiveChoice === 'promote' ? '升级成功！' : '归档成功！'}
      </h3>
      
      <p className="text-gray-600 mb-6 animate-slide-up" style={{ animationDelay: '0.1s' }}>
        {archiveChoice === 'promote' 
          ? `班级已成功升级。${successData?.movedStudents?.length || 0} 位学生已转移到新班级。`
          : `班级已成功归档。已生成 ${successData?.archivedClass?.studentReportsCount || 0} 份学生报告和班级分析报告。`
        }
      </p>

      {archiveChoice === 'promote' && successData?.newClass && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-6 animate-slide-up" style={{ animationDelay: '0.2s' }}>
          <div className="text-sm text-green-800">
            <p className="font-semibold mb-2">新班级信息：</p>
            <p>班级名称: {successData.newClass.name}</p>
            <p>邀请码: <span className="font-mono font-bold">{successData.newClass.invitationCode}</span></p>
            <p>学生数量: {successData.newClass.studentCount} 人</p>
          </div>
        </div>
      )}

      <button
        onClick={handleClose}
        className="btn-primary w-full group animate-slide-up"
        style={{ animationDelay: '0.3s' }}
      >
        完成
        <Sparkles className="w-5 h-5 ml-2 group-hover:rotate-12 transition-transform" />
      </button>
    </div>
  );

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={() => {}}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-3xl bg-white shadow-2xl transition-all">
                {step === 'choice' && renderChoiceStep()}
                {step === 'promote-form' && renderPromoteFormStep()}
                {step === 'confirm-archive' && renderConfirmArchiveStep()}
                {step === 'confirm-promote' && renderConfirmPromoteStep()}
                {step === 'processing' && renderProcessingStep()}
                {step === 'success' && renderSuccessStep()}
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}
