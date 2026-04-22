import {
  Download,
  Copy,
  CheckCircle,
  AlertCircle,
  Lightbulb,
  BookOpen,
  X,
} from 'lucide-react';
import { useToast } from '~/components/Toast';

export interface GeneratedQuestion {
  question: string;
  options?: string[];
  correctAnswer: string;
  explanation: string;
  knowledgeArea: string;
  difficulty: 'easy' | 'medium' | 'hard';
  mistakeType: string;
}

export interface QuestionGenerationResult {
  questions: GeneratedQuestion[];
  summary: string;
  mistakesAnalyzed: number;
  materialsUsed: number;
  modelUsed: string;
  studentName: string;
}

interface GeneratedQuestionsDisplayProps {
  result: QuestionGenerationResult;
  onRegenerate: () => void;
  onClose?: () => void;
}

function getDifficultyColor(difficulty: string) {
  switch (difficulty) {
    case 'easy': return 'text-green-600 bg-green-100';
    case 'medium': return 'text-yellow-600 bg-yellow-100';
    case 'hard': return 'text-red-600 bg-red-100';
    default: return 'text-gray-600 bg-gray-100';
  }
}

function getDifficultyLabel(difficulty: string) {
  switch (difficulty) {
    case 'easy': return '简单';
    case 'medium': return '中等';
    case 'hard': return '困难';
    default: return difficulty;
  }
}

export function GeneratedQuestionsDisplay({
  result,
  onRegenerate,
  onClose,
}: GeneratedQuestionsDisplayProps) {
  const toast = useToast();

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      toast.success('已复制到剪贴板');
    }).catch(() => {
      toast.error('复制失败');
    });
  };

  const exportQuestions = () => {
    const content = `# ${result.studentName} 的针对性练习题

## 生成信息
|- 分析错误数量: ${result.mistakesAnalyzed}
|- 使用教学资料: ${result.materialsUsed} 份
|- AI模型: ${result.modelUsed}
|- 生成时间: ${new Date().toLocaleString('zh-CN')}

## 总结
${result.summary}

## 练习题

${result.questions.map((q, index) => `
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
    a.download = `${result.studentName}_练习题_${new Date().toISOString().split('T')[0]}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">
            {result.studentName} 的针对性练习题
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            基于 {result.mistakesAnalyzed} 个错误分析，使用 {result.materialsUsed} 份教学资料生成
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
            onClick={onRegenerate}
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
            <p className="text-blue-800 text-sm">{result.summary}</p>
          </div>
        </div>
      </div>

      {/* Questions */}
      <div className="space-y-6">
        {result.questions.map((question, index) => (
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
