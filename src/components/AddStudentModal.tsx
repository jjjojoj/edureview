import { Fragment } from "react";
import { Dialog, Transition } from "@headlessui/react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { 
  X, 
  UserPlus, 
  User,
  GraduationCap,
  Loader2,
  Sparkles,
  Check
} from "lucide-react";
import { useTRPC } from "~/trpc/react";
import { useAuthStore } from "~/stores/authStore";
import toast from "react-hot-toast";

const addStudentSchema = z.object({
  name: z.string().min(1, "学生姓名不能为空").max(100, "姓名过长"),
});

type AddStudentFormData = z.infer<typeof addStudentSchema>;

interface AddStudentModalProps {
  isOpen: boolean;
  onClose: () => void;
  classId: number;
  onSuccess?: () => void;
}

export function AddStudentModal({ isOpen, onClose, classId, onSuccess }: AddStudentModalProps) {
  const trpc = useTRPC();
  const { authToken } = useAuthStore();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<AddStudentFormData>({
    resolver: zodResolver(addStudentSchema),
  });

  const addStudentMutation = useMutation(trpc.addStudentToClass.mutationOptions());

  const onSubmit = async (data: AddStudentFormData) => {
    if (!authToken) return;

    try {
      await addStudentMutation.mutateAsync({
        authToken,
        classId,
        name: data.name,
      });

      toast.success(`${data.name} 已成功添加到班级！`);
      reset();
      onSuccess?.();
      onClose();
    } catch (error: any) {
      console.error("Add student error:", error);
      toast.error(error.message || "添加学生失败");
    }
  };

  const handleClose = () => {
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
              <Dialog.Panel className="w-full max-w-lg transform overflow-hidden rounded-3xl bg-white shadow-2xl transition-all">
                {/* Header */}
                <div className="px-8 pt-8 pb-6 border-b border-gray-100">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center mr-4 shadow-glow">
                        <UserPlus className="w-6 h-6 text-white" />
                      </div>
                      <div className="text-left">
                        <Dialog.Title className="text-xl font-bold text-gray-900">
                          添加新学生
                        </Dialog.Title>
                        <p className="text-sm text-gray-500 mt-1">向您的班级添加学生</p>
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
                        学生姓名 *
                      </label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                        <input
                          {...register("name")}
                          type="text"
                          id="name"
                          className="form-input pl-10"
                          placeholder="请输入学生姓名"
                        />
                      </div>
                      {errors.name && (
                        <p className="text-red-600 text-sm mt-2 animate-slide-down">{errors.name.message}</p>
                      )}
                    </div>

                    <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 animate-slide-up" style={{ animationDelay: '0.1s' }}>
                      <div className="flex items-start">
                        <GraduationCap className="w-5 h-5 text-blue-600 mr-3 mt-0.5" />
                        <div className="text-sm text-blue-800">
                          <p className="font-semibold mb-1">自动信息填充</p>
                          <p>学生的学校、年级和班级信息将自动从您的账户信息中获取。</p>
                        </div>
                      </div>
                    </div>

                    <div className="flex space-x-4 animate-slide-up" style={{ animationDelay: '0.2s' }}>
                      <button
                        type="button"
                        onClick={handleClose}
                        className="btn-secondary flex-1"
                      >
                        取消
                      </button>
                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="btn-primary flex-1 disabled:opacity-50 disabled:cursor-not-allowed group"
                      >
                        {isSubmitting ? (
                          <>
                            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                            添加中...
                          </>
                        ) : (
                          <>
                            <UserPlus className="w-5 h-5 mr-2" />
                            添加学生
                            <Sparkles className="w-5 h-5 ml-2 group-hover:rotate-12 transition-transform" />
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </form>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}
