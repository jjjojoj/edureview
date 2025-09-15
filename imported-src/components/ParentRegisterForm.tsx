import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { Eye, EyeOff, UserPlus, Mail, Lock, User, Heart, GraduationCap, School } from "lucide-react";
import { useState } from "react";
import { useTRPC } from "~/trpc/react";
import toast from "react-hot-toast";

const registerSchema = z.object({
  name: z.string().min(2, "姓名至少需要2个字符"),
  phoneNumber: z.string().min(10, "请输入有效的手机号码"),
  password: z.string()
    .min(8, "密码至少需要8个字符")
    .regex(/^[A-Za-z0-9]+$/, "密码不能包含特殊字符")
    .regex(/(?=.*[a-z])/, "密码必须包含至少一个小写字母")
    .regex(/(?=.*[A-Z])/, "密码必须包含至少一个大写字母")
    .regex(/(?=.*\d)/, "密码必须包含至少一个数字"),
  confirmPassword: z.string(),
  childName: z.string().min(2, "孩子姓名至少需要2个字符"),
  schoolName: z.string().min(2, "学校名称不能为空"),
  grade: z.string().min(1, "年级不能为空"),
  className: z.string().min(1, "班级名称不能为空"),
  invitationCode: z.string().length(6, "邀请码必须是6位数字").regex(/^\d{6}$/, "邀请码只能包含数字"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "两次输入的密码不一致",
  path: ["confirmPassword"],
}).refine((data) => !data.password.toLowerCase().includes(data.name.toLowerCase()), {
  message: "密码不能包含您的姓名",
  path: ["password"],
});

type RegisterFormData = z.infer<typeof registerSchema>;

interface ParentRegisterFormProps {
  onSuccess?: () => void;
  onSwitchToLogin?: () => void;
}

export function ParentRegisterForm({ onSuccess, onSwitchToLogin }: ParentRegisterFormProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const trpc = useTRPC();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  });

  const registerMutation = useMutation(trpc.registerParent.mutationOptions());

  const onSubmit = async (data: RegisterFormData) => {
    try {
      const result = await registerMutation.mutateAsync({
        name: data.name,
        phoneNumber: data.phoneNumber,
        password: data.password,
        childInfo: {
          name: data.childName,
          schoolName: data.schoolName,
          grade: data.grade,
          className: data.className,
        },
        invitationCode: data.invitationCode,
      });
      toast.success("账户创建成功！请登录。");
      onSuccess?.();
    } catch (error: any) {
      toast.error(error.message || "注册失败");
    }
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
        <div className="px-8 pt-8 pb-6">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-br from-pink-500 to-rose-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Heart className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900">注册家长</h2>
            <p className="text-gray-600 mt-2">创建您的账户并连接您的孩子</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {/* Parent Information */}
            <div className="border-b border-gray-200 pb-4">
              <h3 className="text-sm font-medium text-gray-900 mb-3">您的信息</h3>
              
              <div className="space-y-4">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                    您的姓名
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      {...register("name")}
                      type="text"
                      id="name"
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-colors"
                      placeholder="请输入您的姓名"
                    />
                  </div>
                  {errors.name && (
                    <p className="text-red-600 text-sm mt-1">{errors.name.message}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-700 mb-2">
                    手机号码
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      {...register("phoneNumber")}
                      type="tel"
                      id="phoneNumber"
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-colors"
                      placeholder="请输入手机号码"
                    />
                  </div>
                  {errors.phoneNumber && (
                    <p className="text-red-600 text-sm mt-1">{errors.phoneNumber.message}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                    密码
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      {...register("password")}
                      type={showPassword ? "text" : "password"}
                      id="password"
                      className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-colors"
                      placeholder="创建安全密码"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                  {errors.password && (
                    <p className="text-red-600 text-sm mt-1">{errors.password.message}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                    确认密码
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      {...register("confirmPassword")}
                      type={showConfirmPassword ? "text" : "password"}
                      id="confirmPassword"
                      className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-colors"
                      placeholder="确认您的密码"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                  {errors.confirmPassword && (
                    <p className="text-red-600 text-sm mt-1">{errors.confirmPassword.message}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Child Information */}
            <div>
              <h3 className="text-sm font-medium text-gray-900 mb-3">您孩子的信息</h3>
              
              <div className="space-y-4">
                <div>
                  <label htmlFor="childName" className="block text-sm font-medium text-gray-700 mb-2">
                    孩子姓名
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      {...register("childName")}
                      type="text"
                      id="childName"
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-colors"
                      placeholder="请输入孩子姓名"
                    />
                  </div>
                  {errors.childName && (
                    <p className="text-red-600 text-sm mt-1">{errors.childName.message}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="schoolName" className="block text-sm font-medium text-gray-700 mb-2">
                    学校名称
                  </label>
                  <div className="relative">
                    <School className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      {...register("schoolName")}
                      type="text"
                      id="schoolName"
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-colors"
                      placeholder="请输入学校名称"
                    />
                  </div>
                  {errors.schoolName && (
                    <p className="text-red-600 text-sm mt-1">{errors.schoolName.message}</p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="grade" className="block text-sm font-medium text-gray-700 mb-2">
                      年级
                    </label>
                    <div className="relative">
                      <GraduationCap className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                      <input
                        {...register("grade")}
                        type="text"
                        id="grade"
                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-colors"
                        placeholder="例如：五年级"
                      />
                    </div>
                    {errors.grade && (
                      <p className="text-red-600 text-sm mt-1">{errors.grade.message}</p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="className" className="block text-sm font-medium text-gray-700 mb-2">
                      班级名称
                    </label>
                    <input
                      {...register("className")}
                      type="text"
                      id="className"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-colors"
                      placeholder="例如：五年级A班"
                    />
                    {errors.className && (
                      <p className="text-red-600 text-sm mt-1">{errors.className.message}</p>
                    )}
                  </div>
                </div>

                <div>
                  <label htmlFor="invitationCode" className="block text-sm font-medium text-gray-700 mb-2">
                    班级邀请码
                  </label>
                  <input
                    {...register("invitationCode")}
                    type="text"
                    id="invitationCode"
                    maxLength={6}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-colors text-center text-lg font-mono tracking-wider"
                    placeholder="123456"
                  />
                  {errors.invitationCode && (
                    <p className="text-red-600 text-sm mt-1">{errors.invitationCode.message}</p>
                  )}
                  <p className="text-xs text-gray-500 mt-1">
                    请输入老师提供的6位数邀请码
                  </p>
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-gradient-to-r from-pink-500 to-rose-600 text-white py-3 px-4 rounded-lg font-medium hover:from-pink-600 hover:to-rose-700 focus:ring-2 focus:ring-pink-500 focus:ring-offset-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? "创建账户中..." : "创建账户"}
            </button>
          </form>
        </div>

        <div className="px-8 py-4 bg-gray-50 border-t border-gray-100">
          <p className="text-center text-sm text-gray-600">
            已有账户？{" "}
            <button
              onClick={onSwitchToLogin}
              className="font-medium text-pink-600 hover:text-pink-500 transition-colors"
            >
              点击登录
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
