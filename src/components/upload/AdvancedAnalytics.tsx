import {
  Brain,
  CheckCircle,
  TrendingUp,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { useState } from "react";

interface AnalyticsData {
  topStrengths: { strength: string; count: number }[];
  topImprovements: { improvement: string; count: number }[];
}

interface AdvancedAnalyticsProps {
  analytics: AnalyticsData;
}

export function AdvancedAnalytics({ analytics }: AdvancedAnalyticsProps) {
  const [showAdvanced, setShowAdvanced] = useState(false);

  return (
    <div className="space-y-4">
      <button
        onClick={() => setShowAdvanced(!showAdvanced)}
        className="flex items-center justify-between w-full p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
      >
        <div className="flex items-center">
          <Brain className="w-5 h-5 text-purple-600 mr-2" />
          <span className="font-medium text-gray-900">Advanced Analytics</span>
        </div>
        {showAdvanced ? (
          <ChevronUp className="w-5 h-5 text-gray-600" />
        ) : (
          <ChevronDown className="w-5 h-5 text-gray-600" />
        )}
      </button>

      {showAdvanced && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Top Strengths */}
          {analytics.topStrengths.length > 0 && (
            <div className="space-y-3">
              <h5 className="font-medium text-gray-900 flex items-center">
                <CheckCircle className="w-4 h-4 text-green-600 mr-2" />
                Top Strengths
              </h5>
              <div className="space-y-2">
                {analytics.topStrengths.map((item, index) => (
                  <div key={index} className="flex items-center justify-between p-2 bg-green-50 rounded">
                    <span className="text-sm text-green-800">{item.strength}</span>
                    <span className="text-xs font-medium text-green-600">{item.count}x</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Top Improvements */}
          {analytics.topImprovements.length > 0 && (
            <div className="space-y-3">
              <h5 className="font-medium text-gray-900 flex items-center">
                <TrendingUp className="w-4 h-4 text-blue-600 mr-2" />
                Areas for Improvement
              </h5>
              <div className="space-y-2">
                {analytics.topImprovements.map((item, index) => (
                  <div key={index} className="flex items-center justify-between p-2 bg-blue-50 rounded">
                    <span className="text-sm text-blue-800">{item.improvement}</span>
                    <span className="text-xs font-medium text-blue-600">{item.count}x</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
