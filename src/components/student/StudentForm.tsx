import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  UserPlus,
  User,
  GraduationCap,
  Loader2,
  Sparkles,
  Hash,
  Phone,
} from "lucide-react";

export const MAX_NAME_LENGTH = 50;
export const MAX_STUDENT_ID_LENGTH = 30;
export const MAX_PHONE_LENGTH = 11;

const addStudentSchema = z.object({
  name: z
    .string()
    .min(1, "学生姓名不能为空")
    .max(MAX_NAME_LENGTH, "姓名过长"),
  studentId: z
    .string()
    .max(MAX_STUDENT_ID_LENGTH, "学号过长")
    .optional()
    .or(z.literal("")),
  phone: z
    .string()
    .max(MAX_PHONE_LENGTH, "手机号过长")
    .optional()
    .or(z.literal("")),
});

export type StudentFormData = {
  name: string;
  studentId?: string;
  phone?: string;
};

interface StudentFormProps {
  onSubmit: (data: StudentFormData) => Promise<boolean>;
  isSubmitting: boolean;
  onCancel: () => void;
}

export function StudentForm({
  onSubmit,
  isSubmitting,
  onCancel,
}: StudentFormProps) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<StudentFormData>({
    resolver: zodResolver(addStudentSchema),
    defaultValues: { name: "", studentId: "", phone: "" },
  });

  const handleFormSubmit = async (data: StudentFormData) => {
    const sanitized: StudentFormData = {
      name: data.name.trim(),
      studentId: data.studentId?.trim() || undefined,
      phone: data.phone?.trim() || undefined,
    };
    const success = await onSubmit(sanitized);
    if (success) reset();
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="px-8 py-6">
      <div className="space-y-6">
        {/* Name */}
        <div className="animate-slide-up">
          <label
            htmlFor="name"
            className="block text-sm font-semibold text-gray-700 mb-2"
          >
            学生姓名 *
          </label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              {...register("name")}
              type="text"
              id="name"
              maxLength={MAX_NAME_LENGTH}
              className="form-input pl-10"
              placeholder="请输入学生姓名"
            />
          </div>
          {errors.name && (
            <p className="text-red-600 text-sm mt-2 animate-slide-down">
              {errors.name.message}
            </p>
          )}
        </div>

        {/* Student ID */}
        <div
          className="animate-slide-up"
          style={{ animationDelay: "0.05s" }}
        >
          <label
            htmlFor="studentId"
            className="block text-sm font-semibold text-gray-700 mb-2"
          >
            学号 <span className="text-gray-400">(可选)</span>
          </label>
          <div className="relative">
            <Hash className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              {...register("studentId")}
              type="text"
              id="studentId"
              maxLength={MAX_STUDENT_ID_LENGTH}
              className="form-input pl-10"
              placeholder="请输入学号（可选）"
            />
          </div>
          {errors.studentId && (
            <p className="text-red-600 text-sm mt-2 animate-slide-down">
              {errors.studentId.message}
            </p>
          )}
        </div>

        {/* Phone */}
        <div
          className="animate-slide-up"
          style={{ animationDelay: "0.1s" }}
        >
          <label
            htmlFor="phone"
            className="block text-sm font-semibold text-gray-700 mb-2"
          >
            手机号 <span className="text-gray-400">(可选)</span>
          </label>
          <div className="relative">
            <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              {...register("phone")}
              type="text"
              id="phone"
              maxLength={MAX_PHONE_LENGTH}
              className="form-input pl-10"
              placeholder="请输入手机号（可选）"
            />
          </div>
          {errors.phone && (
            <p className="text-red-600 text-sm mt-2 animate-slide-down">
              {errors.phone.message}
            </p>
          )}
        </div>

        {/* Info box */}
        <div
          className="bg-blue-50 border border-blue-200 rounded-xl p-4 animate-slide-up"
          style={{ animationDelay: "0.15s" }}
        >
          <div className="flex items-start">
            <GraduationCap className="w-5 h-5 text-blue-600 mr-3 mt-0.5" />
            <div className="text-sm text-blue-800">
              <p className="font-semibold mb-1">自动信息填充</p>
              <p>
                学生的学校、年级和班级信息将自动从您的账户信息中获取。
              </p>
            </div>
          </div>
        </div>

        {/* Buttons */}
        <div
          className="flex space-x-4 animate-slide-up"
          style={{ animationDelay: "0.2s" }}
        >
          <button
            type="button"
            onClick={onCancel}
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
  );
}
