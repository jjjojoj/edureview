import { 
  Brain,
  TrendingUp,
  Target,
  Lightbulb,
  CheckCircle,
  AlertTriangle,
  Sparkles,
  BarChart3
} from "lucide-react";

interface ProgressInsightPanelProps {
  aiAnalysis?: {
    progressPercentage: number;
    keyInsights: string[];
    recommendedActions: string[];
    strengthAreas: string[];
    improvementAreas: string[];
    summary: string;
  };
  isLoading?: boolean;
}

export function ProgressInsightPanel({ aiAnalysis, isLoading }: ProgressInsightPanelProps) {
  if (isLoading) {
    return (
      <div className="card animate-slide-up">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center">
            <Brain className="w-6 h-6 text-purple-600 mr-3" />
            <h3 className="text-lg font-bold text-gray-900">AI 进度分析</h3>
            <div className="ml-auto">
              <div className="animate-spin w-5 h-5 border-2 border-purple-600 border-t-transparent rounded-full"></div>
            </div>
          </div>
        </div>
        <div className="p-6">
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!aiAnalysis) {
    return (
      <div className="card animate-slide-up">
        <div className="p-6 text-center">
          <Brain className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-gray-900 mb-2">AI 分析不可用</h3>
          <p className="text-gray-500">暂时无法获取进度分析</p>
        </div>
      </div>
    );
  }

  return (
    <div className="card animate-slide-up">
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Brain className="w-6 h-6 text-purple-600 mr-3" />
            <h3 className="text-lg font-bold text-gray-900">AI 进度分析</h3>
          </div>
          <div className="flex items-center space-x-2">
            <Sparkles className="w-4 h-4 text-purple-600" />
            <span className="text-sm font-medium text-purple-600">智能洞察</span>
          </div>
        </div>
      </div>
      
      <div className="p-6 space-y-6">
        {/* Progress Summary */}
        <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center">
              <TrendingUp className="w-5 h-5 text-purple-600 mr-2" />
              <span className="font-semibold text-gray-900">整体进度</span>
            </div>
            <div className="text-2xl font-bold text-purple-600">
              {aiAnalysis.progressPercentage}%
            </div>
          </div>
          <p className="text-sm text-gray-700">{aiAnalysis.summary}</p>
        </div>

        {/* Key Insights */}
        {aiAnalysis.keyInsights.length > 0 && (
          <div>
            <div className="flex items-center mb-3">
              <Lightbulb className="w-5 h-5 text-yellow-600 mr-2" />
              <h4 className="font-semibold text-gray-900">关键洞察</h4>
            </div>
            <div className="space-y-2">
              {aiAnalysis.keyInsights.map((insight, index) => (
                <div key={index} className="flex items-start space-x-3 p-3 bg-yellow-50 rounded-lg">
                  <div className="w-2 h-2 bg-yellow-500 rounded-full mt-2 flex-shrink-0"></div>
                  <p className="text-sm text-gray-700">{insight}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Strengths and Improvements */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {aiAnalysis.strengthAreas.length > 0 && (
            <div>
              <div className="flex items-center mb-3">
                <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
                <h4 className="font-semibold text-gray-900">优势领域</h4>
              </div>
              <div className="space-y-2">
                {aiAnalysis.strengthAreas.map((strength, index) => (
                  <div key={index} className="flex items-center space-x-2 p-2 bg-green-50 rounded-lg">
                    <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
                    <p className="text-sm text-gray-700">{strength}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {aiAnalysis.improvementAreas.length > 0 && (
            <div>
              <div className="flex items-center mb-3">
                <Target className="w-5 h-5 text-orange-600 mr-2" />
                <h4 className="font-semibold text-gray-900">改进领域</h4>
              </div>
              <div className="space-y-2">
                {aiAnalysis.improvementAreas.map((area, index) => (
                  <div key={index} className="flex items-center space-x-2 p-2 bg-orange-50 rounded-lg">
                    <AlertTriangle className="w-4 h-4 text-orange-600 flex-shrink-0" />
                    <p className="text-sm text-gray-700">{area}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Recommended Actions */}
        {aiAnalysis.recommendedActions.length > 0 && (
          <div>
            <div className="flex items-center mb-3">
              <BarChart3 className="w-5 h-5 text-blue-600 mr-2" />
              <h4 className="font-semibold text-gray-900">建议行动</h4>
            </div>
            <div className="space-y-2">
              {aiAnalysis.recommendedActions.map((action, index) => (
                <div key={index} className="flex items-start space-x-3 p-3 bg-blue-50 rounded-lg border-l-4 border-blue-400">
                  <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-xs font-bold text-blue-600">{index + 1}</span>
                  </div>
                  <p className="text-sm text-gray-700">{action}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
