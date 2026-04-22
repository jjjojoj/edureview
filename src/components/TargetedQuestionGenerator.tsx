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
  Download, 
  Copy, 
  CheckCircle,
  AlertCircle,
  Lightbulb,
  BookOpen,
  X
} from 'lucide-react';
import { useAuthStore } from '~/stores/authStore';

const questionGenerationSchema = z.object({
  studentId: z.number().min(1, '请选择学生'),
  knowledgeAreaIds: z.array(z.number()).optional(),
  questionCount: z.number().min(1).max(20).default(5),
  difficultyLevel: z.enum(['easy', 'medium', 'hard']).default('medium'),
});

type QuestionGenerationFormData = z.infer<typeof questionGenerationSchema>;

interface GeneratedQuestion {
  question: string;
  options?: string[];
  correctAnswer: string;
  explanation: string;
  knowledgeArea: string;
  difficulty: 'easy' | 'medium' | 'hard';
  mistakeType: string;
}

interface QuestionGenerationResult {
  questions: GeneratedQuestion[];
  summary: string;
  mistakesAnalyzed: number;
  materialsUsed: number;
  modelUsed: string;
  studentName: string;
}

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

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'text-green-600 bg-green-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'hard': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getDifficultyLabel = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return '简单';
      case 'medium': return '中等';
      case 'hard': return '困难';
      default: return difficulty;
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      toast.success('已复制到剪贴板');
    }).catch(() => {
      toast.error('复制失败');
    });
  };

  const exportQuestions = () => {
    if (!generatedQuestions) return;

    const content = `# ${generatedQuestions.studentName} 的针对性练习题

## 生成信息
- 分析错误数量: ${generatedQuestions.mistakesAnalyzed}
- 使用教学资料: ${generatedQuestions.materialsUsed} 份
- AI模型: ${generatedQuestions.modelUsed}
- 生成时间: ${new Date().toLocaleString('zh-CN')}

## 总结
${generatedQuestions.summary}

## 练习题

${generatedQuestions.questions.map((q, index) => `
### 第 ${index + 1} 题 (${getDifficultyLabel(q.difficulty)} - ${q.knowledgeArea})

**题目**: ${q.question}

${q.options ? q.options.map((option, i) => `${String.fromCharCode(65 + i)}. ${option}`).join('\n') : ''}

**正确答案**: ${q.correctAnswer}

**解释**: ${q.explanation}

**针对错误类型**: ${q.mistakeType}

---
`).join('')}`;

    const blob = new Blob([content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${generatedQuestions.studentName}_练习题_${new Date().toISOString().split('T')[0]}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // If questions have been generated, show the results
  if (generatedQuestions) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6 max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              {generatedQuestions.studentName} 的针对性练习题
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              基于 {generatedQuestions.mistakesAnalyzed} 个错误分析，使用 {generatedQuestions.materialsUsed} 份教学资料生成
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={exportQuestions}
              className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200"
            >
              <Download className="h-4 w-4 mr-2" />
              导出
            </button>
            <button
              onClick={() => setGeneratedQuestions(null)}
              className="inline-flex items-center px-3 py-2 text-sm font-medium text-blue-700 bg-blue-100 border border-blue-300 rounded-md hover:bg-blue-200"
            >
              重新生成
            </button>
            {onClose && (
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            )}
          </div>
        </div>

        {/* Summary */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <div className="flex items-start space-x-2">
            <Lightbulb className="h-5 w-5 text-blue-600 mt-0.5" />
            <div>
              <h3 className="font-medium text-blue-900 mb-1">生成总结</h3>
              <p className="text-blue-800 text-sm">{generatedQuestions.summary}</p>
            </div>
          </div>
        </div>

        {/* Questions */}
        <div className="space-y-6">
          {generatedQuestions.questions.map((question, index) => (
            <div key={index} className="border border-gray-200 rounded-lg p-6">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-lg font-medium text-gray-900">
                  第 {index + 1} 题
                </h3>
                <div className="flex items-center space-x-2">
                  <span className={`px-2 py-1 text-xs font-medium rounded ${getDifficultyColor(question.difficulty)}`}>
                    {getDifficultyLabel(question.difficulty)}
                  </span>
                  <span className="px-2 py-1 text-xs font-medium text-blue-600 bg-blue-100 rounded">
                    {question.knowledgeArea}
                  </span>
                </div>
              </div>

              {/* Question Text */}
              <div className="mb-4">
                <p className="text-gray-900 font-medium mb-2">{question.question}</p>
                
                {/* Multiple Choice Options */}
                {question.options && question.options.length > 0 && (
                  <div className="space-y-2 ml-4">
                    {question.options.map((option, optionIndex) => (
                      <div key={optionIndex} className="flex items-center space-x-2">
                        <span className="text-sm font-medium text-gray-500">
                          {String.fromCharCode(65 + optionIndex)}.
                        </span>
                        <span className="text-sm text-gray-700">{option}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Correct Answer */}
              <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded">
                <div className="flex items-start space-x-2">
                  <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-green-900">正确答案</p>
                    <p className="text-sm text-green-800">{question.correctAnswer}</p>
                  </div>
                </div>
              </div>

              {/* Explanation */}
              <div className="mb-4 p-3 bg-gray-50 border border-gray-200 rounded">
                <div className="flex items-start space-x-2">
                  <BookOpen className="h-4 w-4 text-gray-600 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">解题思路</p>
                    <p className="text-sm text-gray-700">{question.explanation}</p>
                  </div>
                </div>
              </div>

              {/* Mistake Type */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <AlertCircle className="h-4 w-4 text-orange-500" />
                  <span className="text-sm text-gray-600">
                    针对错误类型: {question.mistakeType}
                  </span>
                </div>
                <button
                  onClick={() => copyToClipboard(`${question.question}\n\n正确答案: ${question.correctAnswer}\n\n解释: ${question.explanation}`)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <Copy className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
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
