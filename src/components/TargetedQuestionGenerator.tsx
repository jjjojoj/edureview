import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTRPC } from '~/trpc/react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useToast } from '~/components/Toast';
import {
  Brain,
  User,
  Target,
  Settings,
  Lightbulb,
  X,
} from 'lucide-react';
import { useAuthStore } from '~/stores/authStore';
import {
  GeneratedQuestionsDisplay,
  type QuestionGenerationResult,
} from '~/components/question/GeneratedQuestionsDisplay';

const questionGenerationSchema = z.object({
  studentId: z.number().min(1, '请选择学生'),
  knowledgeAreaIds: z.array(z.number()).optional(),
  questionCount: z.number().min(1).max(20).default(5),
  difficultyLevel: z.enum(['easy', 'medium', 'hard']).default('medium'),
});

type QuestionGenerationFormData = z.infer<typeof questionGenerationSchema>;

interface TargetedQuestionGeneratorProps {
  classId?: number;
  studentId?: number;
  onClose?: () => void;
}

export function TargetedQuestionGenerator({ classId, studentId, onClose }: TargetedQuestionGeneratorProps) {
  const toast = useToast();
  const trpc = useTRPC();
  const { authToken } = useAuthStore();
  const [generatedQuestions, setGeneratedQuestions] = useState<QuestionGenerationResult | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
  } = useForm<QuestionGenerationFormData>({
    resolver: zodResolver(questionGenerationSchema) as any,
    defaultValues: {
      studentId: studentId || undefined,
      questionCount: 5,
      difficultyLevel: 'medium',
    },
  });

  // Get class students if classId is provided
  const { data: studentsData } = useQuery({
    ...trpc.getClassStudents.queryOptions({
      authToken: authToken!,
      classId: classId!,
    }),
    enabled: !!authToken && !!classId,
  });

  const students = (studentsData as any)?.students ?? [];

  // Generate questions mutation
  const generateMutation = useMutation({
    mutationFn: (data: QuestionGenerationFormData) =>
      (trpc as any).generateTargetedQuestions.mutateAsync({
        authToken: authToken!,
        ...data,
      }),
    onSuccess: (result: any) => {
      setGeneratedQuestions(result);
      toast.success(`成功生成 ${result.questions.length} 道练习题！`);
    },
    onError: (error) => {
      toast.error('生成练习题失败，请重试');
    },
  });

  const onSubmit = async (data: QuestionGenerationFormData) => {
    if (!authToken) {
      toast.error('请先登录');
      return;
    }

    setIsGenerating(true);
    try {
      await generateMutation.mutateAsync(data);
    } finally {
      setIsGenerating(false);
    }
  };

  // If questions have been generated, show the results
  if (generatedQuestions) {
    return (
      <GeneratedQuestionsDisplay
        result={generatedQuestions}
        onRegenerate={() => setGeneratedQuestions(null)}
        onClose={onClose}
      />
    );
  }

  // Show the generation form
  return (
    <div className="bg-white rounded-lg shadow-lg p-6 max-w-2xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center space-x-2">
          <Brain className="h-6 w-6 text-blue-600" />
          <h2 className="text-xl font-semibold text-gray-900">生成针对性练习题</h2>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-6 w-6" />
          </button>
        )}
      </div>

      <form onSubmit={handleSubmit(onSubmit as any)} className="space-y-6">
        {/* Student Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <User className="inline h-4 w-4 mr-1" />
            选择学生 *
          </label>
          <select
            {...register('studentId', { valueAsNumber: true })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">请选择学生</option>
            {students.map((student: any) => (
              <option key={student.id} value={student.id}>
                {student.name}
              </option>
            ))}
          </select>
          {errors.studentId && (
            <p className="mt-1 text-sm text-red-600">{errors.studentId.message}</p>
          )}
        </div>

        {/* Question Count */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <Target className="inline h-4 w-4 mr-1" />
            题目数量
          </label>
          <select
            {...register('questionCount', { valueAsNumber: true })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
          >
            {[1, 3, 5, 8, 10, 15, 20].map(count => (
              <option key={count} value={count}>{count} 道题</option>
            ))}
          </select>
        </div>

        {/* Difficulty Level */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <Settings className="inline h-4 w-4 mr-1" />
            难度等级
          </label>
          <div className="grid grid-cols-3 gap-2">
            {[
              { value: 'easy', label: '简单', description: '基础概念练习' },
              { value: 'medium', label: '中等', description: '综合应用题' },
              { value: 'hard', label: '困难', description: '深度思考题' },
            ].map((level) => (
              <label key={level.value} className="flex flex-col p-3 border rounded cursor-pointer hover:bg-gray-50">
                <div className="flex items-center space-x-2">
                  <input
                    type="radio"
                    value={level.value}
                    {...register('difficultyLevel')}
                    className="text-blue-600"
                  />
                  <span className="font-medium text-sm">{level.label}</span>
                </div>
                <span className="text-xs text-gray-500 mt-1">{level.description}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Generate Button */}
        <div className="flex justify-end space-x-4">
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200"
            >
              取消
            </button>
          )}
          <button
            type="submit"
            disabled={isGenerating || !watch('studentId')}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isGenerating && (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
            )}
            {isGenerating ? '正在生成...' : '生成练习题'}
          </button>
        </div>
      </form>

      {/* Information Box */}
      <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <div className="flex items-start space-x-2">
          <Lightbulb className="h-5 w-5 text-blue-600 mt-0.5" />
          <div className="text-sm text-blue-800">
            <p className="font-medium mb-1">AI 将基于以下信息生成练习题：</p>
            <ul className="list-disc list-inside space-y-1 text-blue-700">
              <li>学生的历史错题记录和错误模式</li>
              <li>您上传的教学资料库作为权威参考</li>
              <li>学生在各知识领域的掌握情况</li>
              <li>针对性的题目设计和详细解析</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
