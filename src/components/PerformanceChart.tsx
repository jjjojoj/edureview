import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface PerformanceDataPoint {
  date: string;
  score: number;
  title?: string;
  type: 'assignment' | 'exam';
}

interface PerformanceChartProps {
  data: PerformanceDataPoint[];
  title?: string;
  height?: number;
  showLegend?: boolean;
  className?: string;
}

export const PerformanceChart: React.FC<PerformanceChartProps> = ({
  data,
  title = "Performance Trends",
  height = 300,
  showLegend = true,
  className = "",
}) => {
  // Group data by date and type for better visualization
  const processedData = React.useMemo(() => {
    const groupedByDate = new Map<string, { date: string; assignment?: number; exam?: number; }>();
    
    data.forEach(point => {
      const existing = groupedByDate.get(point.date) || { date: point.date };
      if (point.type === 'assignment') {
        existing.assignment = point.score;
      } else {
        existing.exam = point.score;
      }
      groupedByDate.set(point.date, existing);
    });
    
    return Array.from(groupedByDate.values()).sort((a, b) => 
      new Date(a.date).getTime() - new Date(b.date).getTime()
    );
  }, [data]);

  // Calculate trend
  const calculateTrend = () => {
    if (processedData.length < 2) return 'stable';
    
    const allScores = data.map(d => d.score);
    const firstHalf = allScores.slice(0, Math.floor(allScores.length / 2));
    const secondHalf = allScores.slice(Math.floor(allScores.length / 2));
    
    const firstAvg = firstHalf.reduce((sum, score) => sum + score, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((sum, score) => sum + score, 0) / secondHalf.length;
    
    const diff = secondAvg - firstAvg;
    
    if (diff > 5) return 'improving';
    if (diff < -5) return 'declining';
    return 'stable';
  };

  const trend = calculateTrend();
  const averageScore = data.length > 0 
    ? (data.reduce((sum, d) => sum + d.score, 0) / data.length).toFixed(1)
    : '0';

  const TrendIcon = trend === 'improving' ? TrendingUp : 
                   trend === 'declining' ? TrendingDown : Minus;
  
  const trendColor = trend === 'improving' ? 'text-green-600' : 
                    trend === 'declining' ? 'text-red-600' : 'text-gray-600';

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-3">
          <p className="text-sm font-semibold text-gray-900 mb-2">
            {new Date(label).toLocaleDateString('zh-CN')}
          </p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.dataKey === 'assignment' ? '作业' : '考试'}: {entry.value}分
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  if (data.length === 0) {
    return (
      <div className={`card ${className}`}>
        <div className="p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">{title}</h3>
          <div className="text-center py-8">
            <TrendingUp className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">暂无性能数据</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`card ${className}`}>
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-gray-900">{title}</h3>
          <div className="flex items-center space-x-4">
            <div className="text-right">
              <div className="text-sm text-gray-600">平均分</div>
              <div className="text-xl font-bold text-gray-900">{averageScore}</div>
            </div>
            <div className={`flex items-center space-x-1 ${trendColor}`}>
              <TrendIcon className="w-4 h-4" />
              <span className="text-sm font-semibold">
                {trend === 'improving' ? '上升' : trend === 'declining' ? '下降' : '稳定'}
              </span>
            </div>
          </div>
        </div>
        
        <div style={{ height }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={processedData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis 
                dataKey="date" 
                tick={{ fontSize: 12 }}
                tickFormatter={(value) => new Date(value).toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' })}
              />
              <YAxis 
                domain={[0, 100]}
                tick={{ fontSize: 12 }}
                label={{ value: '分数', angle: -90, position: 'insideLeft' }}
              />
              <Tooltip content={<CustomTooltip />} />
              {showLegend && (
                <Legend 
                  formatter={(value) => value === 'assignment' ? '作业' : '考试'}
                />
              )}
              <Line
                type="monotone"
                dataKey="assignment"
                stroke="#3b82f6"
                strokeWidth={2}
                dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6, stroke: '#3b82f6', strokeWidth: 2 }}
                connectNulls={false}
              />
              <Line
                type="monotone"
                dataKey="exam"
                stroke="#8b5cf6"
                strokeWidth={2}
                dot={{ fill: '#8b5cf6', strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6, stroke: '#8b5cf6', strokeWidth: 2 }}
                connectNulls={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};
