import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { 
  Eye, 
  EyeOff, 
  UserPlus, 
  Phone, 
  Lock, 
  User,
  Loader2,
  Check,
  X
} from "lucide-react";
import { useState } from "react";
import { useTRPC } from "~/trpc/react";
import { useToast } from "~/components/Toast";
import { getErrorMessage } from "~/utils/trpcError";

const registerSchema = z.object({
  phoneNumber: z
    .string()
    .min(1, "请输入手机号码")
    .regex(/^1\d{10}$/, "请输入有效的11位手机号码（以1开头）"),
  name: z.string().min(1, "姓名不能为空"),
  password: z.string()
    .min(8, "密码至少需要8个字符")
    .regex(/^[A-Za-z0-9]+$/, "密码不能包含特殊字符")
    .regex(/(?=.*[a-z])/, "密码必须包含至少一个小写字母")
    .regex(/(?=.*[A-Z])/, "密码必须包含至少一个大写字母")
    .regex(/(?=.*\d)/, "密码必须包含至少一个数字"),
}).refine((data) => !data.password.toLowerCase().includes(data.name.toLowerCase()), {
  message: "密码不能包含您的姓名",
  path: ["password"],
});

type RegisterFormData = z.infer<typeof registerSchema>;

interface RegisterFormProps {
  onSuccess?: () => void;
  onSwitchToLogin?: () => void;
}

export function RegisterForm({ onSuccess, onSwitchToLogin }: RegisterFormProps) {
  const [showPassword, setShowPassword] = useState(false);
  const trpc = useTRPC();
  const toast = useToast();

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  });

  const registerMutation = useMutation(trpc.registerTeacher.mutationOptions());
  
  const password = watch("password") || "";
  const name = watch("name") || "";

  const passwordValidation = {
    minLength: password.length >= 8,
    hasLowercase: /(?=.*[a-z])/.test(password),
    hasUppercase: /(?=.*[A-Z])/.test(password),
    hasNumber: /(?=.*\d)/.test(password),
    noSpecialChars: /^[A-Za-z0-9]*$/.test(password),
    noName: !password.toLowerCase().includes(name.toLowerCase()) || !name,
  };

  const onSubmit = async (data: RegisterFormData) => {
    try {
      await registerMutation.mutateAsync(data);
      toast.success("账户创建成功！请登录。");
      onSuccess?.();
    } catch (error: unknown) {
      toast.error(getErrorMessage(error));
    }
  };

  const PasswordRequirement = ({ met, text }: { met: boolean; text: string }) => (
    <div className={`flex items-center text-xs ${met ? 'text-green-600' : 'text-gray-400'} transition-colors`}>
      {met ? <Check className="w-3 h-3 mr-1" /> : <X className="w-3 h-3 mr-1" />}
      {text}
    </div>
  );

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="card overflow-hidden shadow-glow">
        <div className="px-8 pt-8 pb-6">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-glow">
              <UserPlus className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900">创建账户</h2>
            <p className="text-gray-600 mt-2">加入教育平台</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="animate-slide-up">
              <label htmlFor="name" className="block text-sm font-semibold text-gray-700 mb-2">
                姓名
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  {...register("name")}
                  type="text"
                  id="name"
                  className="form-input pl-10"
                  placeholder="请输入您的姓名"
                />
              </div>
              {errors.name && (
                <p className="text-red-600 text-sm mt-2 animate-slide-down">{errors.name.message}</p>
              )}
            </div>

            <div className="animate-slide-up" style={{ animationDelay: '0.1s' }}>
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

            <div className="animate-slide-up" style={{ animationDelay: '0.2s' }}>
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
                  placeholder="创建安全密码"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              
              {password && (
                <div className="mt-3 p-3 bg-gray-50 rounded-lg space-y-1">
                  <PasswordRequirement met={passwordValidation.minLength} text="至少8个字符" />
                  <PasswordRequirement met={passwordValidation.hasLowercase} text="包含小写字母" />
                  <PasswordRequirement met={passwordValidation.hasUppercase} text="包含大写字母" />
                  <PasswordRequirement met={passwordValidation.hasNumber} text="包含数字" />
                  <PasswordRequirement met={passwordValidation.noSpecialChars} text="不包含特殊字符" />
                  <PasswordRequirement met={passwordValidation.noName} text="不能包含您的姓名" />
                </div>
              )}
              
              {errors.password && (
                <p className="text-red-600 text-sm mt-2 animate-slide-down">{errors.password.message}</p>
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
                    创建账户中...
                  </>
                ) : (
                  <>
                    创建账户
                    <UserPlus className="w-5 h-5 ml-2 group-hover:scale-110 transition-transform" />
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        <div className="px-8 py-6 bg-gray-50 border-t border-gray-100">
          <p className="text-center text-sm text-gray-600">
            已有账户？{" "}
            <button
              onClick={onSwitchToLogin}
              className="font-semibold text-blue-600 hover:text-blue-500 transition-colors"
            >
              点击登录
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
