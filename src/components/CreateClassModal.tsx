import { Fragment, useState } from "react";
import { Dialog, Transition } from "@headlessui/react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  X, 
  BookOpen, 
  Users, 
  FileText,
  Loader2,
  Sparkles,
  Plus,
  Copy,
  Check
} from "lucide-react";
import { useTRPC } from "~/trpc/react";
import { useAuthStore } from "~/stores/authStore";
import { useToast } from "~/components/Toast";
import { getErrorMessage } from "~/utils/trpcError";

const createClassSchema = z.object({
  name: z.string().min(1, "班级名称不能为空").max(100, "班级名称过长"),
  description: z.string().max(500, "描述过长").optional(),
  initialStudentCount: z.number().min(1, "学生数量必须至少为1").max(100, "学生数量不能超过100").optional(),
});

type CreateClassFormData = z.infer<typeof createClassSchema>;

interface CreateClassModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CreateClassModal({ isOpen, onClose }: CreateClassModalProps) {
  const [showInviteCode, setShowInviteCode] = useState(false);
  const [inviteCode, setInviteCode] = useState("");
  const [codeCopied, setCodeCopied] = useState(false);
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const { authToken } = useAuthStore();
  const toast = useToast();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CreateClassFormData>({
    resolver: zodResolver(createClassSchema),
  });

  const createClassMutation = useMutation(trpc.createClass.mutationOptions());

  const onSubmit = async (data: CreateClassFormData) => {
    if (!authToken) {
      toast.error("未找到认证令牌，请重新登录");
      return;
    }

    try {
      const result = await createClassMutation.mutateAsync({
        authToken,
        name: data.name,
        description: data.description,
        initialStudentCount: data.initialStudentCount,
      });
      setInviteCode(result.class.invitationCode);
      setShowInviteCode(true);
      
      // Invalidate the teacher classes query to refresh the dashboard
      queryClient.invalidateQueries({ 
        queryKey: trpc.getTeacherClasses.queryKey({ authToken }) 
      });
      
      toast.success(`班级"${result.class.name}"创建成功！`);
      reset();
    } catch (error: unknown) {
      toast.error(getErrorMessage(error));
    }
  };

  const copyInviteCode = async () => {
    try {
      await navigator.clipboard.writeText(inviteCode);
      setCodeCopied(true);
      toast.success("邀请码已复制到剪贴板！");
      setTimeout(() => setCodeCopied(false), 2000);
    } catch (error) {
      toast.error("复制邀请码失败");
    }
  };

  const handleClose = () => {
    setShowInviteCode(false);
    setInviteCode("");
    setCodeCopied(false);
    reset();
    onClose();
  };

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={handleClose}>
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
                {!showInviteCode ? (
                  <>
                    {/* Header */}
                    <div className="px-8 pt-8 pb-6 border-b border-gray-100">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center mr-4 shadow-glow">
                            <BookOpen className="w-6 h-6 text-white" />
                          </div>
                          <div className="text-left">
                            <Dialog.Title className="text-xl font-bold text-gray-900">
                              创建新班级
                            </Dialog.Title>
                            <p className="text-sm text-gray-500 mt-1">为您的学生设置新班级</p>
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

                    {/* Form */}
                    <form onSubmit={handleSubmit(onSubmit)} className="px-8 py-6">
                      <div className="space-y-6">
                        <div className="animate-slide-up">
                          <label htmlFor="name" className="block text-sm font-semibold text-gray-700 mb-2">
                            班级名称 *
                          </label>
                          <input
                            {...register("name")}
                            type="text"
                            id="name"
                            className="form-input"
                            placeholder="例如：七年级数学"
                          />
                          {errors.name && (
                            <p className="text-red-600 text-sm mt-2 animate-slide-down">{errors.name.message}</p>
                          )}
                        </div>

                        <div className="animate-slide-up" style={{ animationDelay: '0.1s' }}>
                          <label htmlFor="description" className="block text-sm font-semibold text-gray-700 mb-2">
                            描述（可选）
                          </label>
                          <textarea
                            {...register("description")}
                            id="description"
                            rows={3}
                            className="form-input resize-none"
                            placeholder="简要描述班级内容和目标..."
                          />
                          {errors.description && (
                            <p className="text-red-600 text-sm mt-2 animate-slide-down">{errors.description.message}</p>
                          )}
                        </div>

                        <div className="animate-slide-up" style={{ animationDelay: '0.2s' }}>
                          <label htmlFor="initialStudentCount" className="block text-sm font-semibold text-gray-700 mb-2">
                            预期学生数量
                          </label>
                          <div className="relative">
                            <Users className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                            <input
                              {...register("initialStudentCount", { valueAsNumber: true })}
                              type="number"
                              id="initialStudentCount"
                              min="1"
                              max="100"
                              className="form-input pl-10"
                              placeholder="例如：30"
                            />
                          </div>
                          {errors.initialStudentCount && (
                            <p className="text-red-600 text-sm mt-2 animate-slide-down">{errors.initialStudentCount.message}</p>
                          )}
                        </div>

                        <div className="animate-slide-up" style={{ animationDelay: '0.3s' }}>
                          <button
                            type="submit"
                            disabled={isSubmitting}
                            className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed group"
                          >
                            {isSubmitting ? (
                              <>
                                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                                创建班级中...
                              </>
                            ) : (
                              <>
                                <Plus className="w-5 h-5 mr-2" />
                                创建班级
                                <Sparkles className="w-5 h-5 ml-2 group-hover:rotate-12 transition-transform" />
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    </form>
                  </>
                ) : (
                  <>
                    {/* Success State */}
                    <div className="px-8 pt-8 pb-6 text-center">
                      <div className="w-20 h-20 bg-gradient-to-br from-green-500 to-emerald-600 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-glow-lg animate-scale-in">
                        <Check className="w-10 h-10 text-white" />
                      </div>
                      
                      <h3 className="text-2xl font-bold text-gray-900 mb-2 animate-slide-up">
                        班级创建成功！
                      </h3>
                      
                      <p className="text-gray-600 mb-8 animate-slide-up" style={{ animationDelay: '0.1s' }}>
                        您的班级已准备就绪。请将邀请码分享给您的学生以便他们加入。
                      </p>

                      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-6 mb-6 animate-slide-up" style={{ animationDelay: '0.2s' }}>
                        <div className="flex items-center justify-center mb-4">
                          <Users className="w-6 h-6 text-blue-600 mr-2" />
                          <span className="text-sm font-semibold text-blue-900">学生邀请码</span>
                        </div>
                        
                        <div className="bg-white rounded-xl p-4 border-2 border-blue-200">
                          <div className="text-3xl font-bold text-center text-blue-700 tracking-wider mb-3">
                            {inviteCode}
                          </div>
                          <button
                            onClick={copyInviteCode}
                            className={`w-full py-2 px-4 rounded-lg font-semibold transition-all ${
                              codeCopied
                                ? "bg-green-100 text-green-700 border border-green-200"
                                : "bg-blue-100 text-blue-700 border border-blue-200 hover:bg-blue-200"
                            }`}
                          >
                            {codeCopied ? (
                              <>
                                <Check className="w-4 h-4 mr-2 inline" />
                                已复制！
                              </>
                            ) : (
                              <>
                                <Copy className="w-4 h-4 mr-2 inline" />
                                复制代码
                              </>
                            )}
                          </button>
                        </div>
                      </div>

                      <div className="space-y-3 animate-slide-up" style={{ animationDelay: '0.3s' }}>
                        <button
                          onClick={handleClose}
                          className="btn-primary w-full group"
                        >
                          好的，谢谢！
                          <Sparkles className="w-5 h-5 ml-2 group-hover:rotate-12 transition-transform" />
                        </button>
                        
                        <p className="text-xs text-gray-500">
                          学生可以使用此代码加入您的班级。代码将在24小时后过期。
                        </p>
                      </div>
                    </div>
                  </>
                )}
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}
