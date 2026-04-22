import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { Eye, EyeOff, LogIn, Phone, Lock, Loader2 } from "lucide-react";
import { useState } from "react";
import { useTRPC } from "~/trpc/react";
import { useAuthStore } from "~/stores/authStore";
import { useToast } from "~/components/Toast";
import { getErrorMessage } from "~/utils/trpcError";

const loginSchema = z.object({
  phoneNumber: z.string().min(10, "请输入有效的手机号码"),
  password: z.string().min(1, "密码不能为空"),
});

type LoginFormData = z.infer<typeof loginSchema>;

interface LoginFormProps {
  onSuccess?: () => void;
  onSwitchToRegister?: () => void;
  mode?: "teacher" | "parent";
}

export function LoginForm({ onSuccess, onSwitchToRegister, mode = "teacher" }: LoginFormProps) {
  const [showPassword, setShowPassword] = useState(false);
  const trpc = useTRPC();
  const setTeacherAuth = useAuthStore((state) => state.setTeacherAuth);
  const toast = useToast();
  const isParent = mode === "parent";

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const loginMutation = useMutation(
    isParent
      ? trpc.loginParent.mutationOptions()
      : trpc.loginTeacher.mutationOptions()
  );

  const onSubmit = async (data: LoginFormData) => {
    try {
      const result = await loginMutation.mutateAsync(data);
      if (isParent) {
        setTeacherAuth(result.authToken, { id: result.parent.id, phoneNumber: result.parent.phoneNumber, name: result.parent.name });
      } else {
        setTeacherAuth(result.authToken, result.teacher);
      }
      const name = isParent ? result.parent.name : result.teacher.name;
      toast.success(`欢迎回来，${name}！`);
      onSuccess?.();
    } catch (error: unknown) {
      toast.error(getErrorMessage(error));
    }
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="card overflow-hidden shadow-glow">
        <div className="px-8 pt-8 pb-6">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-glow">
              <LogIn className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900">欢迎回来</h2>
            <p className="text-gray-600 mt-2">登录您的教师账户</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="animate-slide-up">
              <label htmlFor="phoneNumber" className="block text-sm font-semibold text-gray-700 mb-2">
                手机号码
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  {...register("phoneNumber")}
                  type="tel"
                  id="phoneNumber"
                  className="form-input pl-10"
                  placeholder="请输入手机号码"
                />
              </div>
              {errors.phoneNumber && (
                <p className="text-red-600 text-sm mt-2 animate-slide-down">{errors.phoneNumber.message}</p>
              )}
            </div>

            <div className="animate-slide-up" style={{ animationDelay: '0.1s' }}>
              <label htmlFor="password" className="block text-sm font-semibold text-gray-700 mb-2">
                密码
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  {...register("password")}
                  type={showPassword ? "text" : "password"}
                  id="password"
                  className="form-input pl-10 pr-12"
                  placeholder="请输入您的密码"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? "隐藏密码" : "显示密码"}
                  aria-pressed={showPassword}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {errors.password && (
                <p className="text-red-600 text-sm mt-2 animate-slide-down">{errors.password.message}</p>
              )}
            </div>

            <div className="animate-slide-up" style={{ animationDelay: '0.2s' }}>
              <button
                type="submit"
                disabled={isSubmitting}
                className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed group"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    登录中...
                  </>
                ) : (
                  <>
                    登录
                    <LogIn className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        <div className="px-8 py-6 bg-gray-50 border-t border-gray-100">
          <p className="text-center text-sm text-gray-600">
            还没有账户？{" "}
            <button
              onClick={onSwitchToRegister}
              className="font-semibold text-blue-600 hover:text-blue-500 transition-colors"
            >
              点击注册
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
