import { Dialog } from "@headlessui/react";
import { X, GraduationCap, Users, ArrowRight } from "lucide-react";
import type { UseFormRegister, FieldErrors } from "react-hook-form";
import type { PromoteClassFormData } from "./types";

interface PromoteFormStepProps {
  register: UseFormRegister<PromoteClassFormData>;
  errors: FieldErrors<PromoteClassFormData>;
  isValid: boolean;
  onBack: () => void;
  onSubmit: () => void;
  onClose: () => void;
}

export function PromoteFormStep({
  register,
  errors,
  isValid,
  onBack,
  onSubmit,
  onClose,
}: PromoteFormStepProps) {
  return (
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
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 rounded-xl hover:bg-gray-100 transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      <form onSubmit={(e) => { e.preventDefault(); onSubmit(); }} className="px-8 py-6">
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

          <div className="animate-slide-up" style={{ animationDelay: "0.1s" }}>
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

          <div className="bg-green-50 border border-green-200 rounded-xl p-4 animate-slide-up" style={{ animationDelay: "0.2s" }}>
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

          <div className="flex space-x-3 animate-slide-up" style={{ animationDelay: "0.3s" }}>
            <button
              type="button"
              onClick={onBack}
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
}
