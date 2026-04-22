import { PerformanceChart } from "~/components/PerformanceChart";
import { KnowledgeAreaChart } from "~/components/KnowledgeAreaChart";
import { TimeRangeSelector } from "~/components/TimeRangeSelector";
import { LineChart } from "lucide-react";

interface PerformanceTrendsData {
  performanceTrends?: any[];
  proficiencyTrends?: any[];
  summary?: {
    averageAssignmentScore: number;
    averageExamScore: number;
    totalAssignments: number;
    totalMistakes: number;
  };
}

interface StudentPerformanceChartProps {
  timeRange: '7d' | '30d' | '90d' | '1y' | 'all';
  onTimeRangeChange: (range: '7d' | '30d' | '90d' | '1y' | 'all') => void;
  data?: PerformanceTrendsData;
}

export function StudentPerformanceChart({
  timeRange,
  onTimeRangeChange,
  data,
}: StudentPerformanceChartProps) {
  return (
    <div className="card animate-slide-up" style={{ animationDelay: '0.4s' }}>
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <LineChart className="w-6 h-6 text-blue-600 mr-3" />
            <h3 className="text-lg font-bold text-gray-900">学习趋势分析</h3>
          </div>
          <TimeRangeSelector
            value={timeRange}
            onChange={onTimeRangeChange}
          />
        </div>
      </div>
      <div className="p-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <PerformanceChart
            data={data?.performanceTrends || []}
            title="成绩趋势"
            height={300}
          />
          <KnowledgeAreaChart
            data={data?.proficiencyTrends || []}
            height={300}
          />
        </div>

        {/* Performance Summary */}
        {data?.summary && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-6 border-t border-gray-200">
            <div className="text-center">
              <div className="text-xl font-bold text-blue-600">
                {data.summary.averageAssignmentScore.toFixed(1)}
              </div>
              <div className="text-sm text-gray-600">平均作业分</div>
            </div>
            <div className="text-center">
              <div className="text-xl font-bold text-purple-600">
                {data.summary.averageExamScore.toFixed(1)}
              </div>
              <div className="text-sm text-gray-600">平均考试分</div>
            </div>
            <div className="text-center">
              <div className="text-xl font-bold text-green-600">
                {data.summary.totalAssignments}
              </div>
              <div className="text-sm text-gray-600">完成作业</div>
            </div>
            <div className="text-center">
              <div className="text-xl font-bold text-orange-600">
                {data.summary.totalMistakes}
              </div>
              <div className="text-sm text-gray-600">总错误数</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
