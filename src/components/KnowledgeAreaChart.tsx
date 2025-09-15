import React, { useState } from 'react';
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import { Brain, TrendingUp, BarChart3 } from 'lucide-react';

interface ProficiencyDataPoint {
  date: string;
  knowledgeArea: string;
  proficiency: number;
  proficiencyLabel: string;
}

interface KnowledgeAreaChartProps {
  data: ProficiencyDataPoint[];
  className?: string;
  height?: number;
  viewType?: 'radar' | 'trend';
}

export const KnowledgeAreaChart: React.FC<KnowledgeAreaChartProps> = ({
  data,
  className = "",
  height = 350,
  viewType: initialViewType = 'radar',
}) => {
  const [viewType, setViewType] = useState<'radar' | 'trend'>(initialViewType);

  // Process data for radar chart (latest proficiency levels)
  const radarData = React.useMemo(() => {
    const latestProficiency = new Map<string, number>();
    
    // Get the latest proficiency level for each knowledge area
    data.forEach(point => {
      const existing = latestProficiency.get(point.knowledgeArea);
      if (!existing || new Date(point.date) > new Date(existing.toString())) {
        latestProficiency.set(point.knowledgeArea, point.proficiency);
      }
    });
    
    return Array.from(latestProficiency.entries()).map(([area, proficiency]) => ({
      knowledgeArea: area,
      proficiency: proficiency * 33.33, // Convert to percentage
      fullMark: 100,
    }));
  }, [data]);

  // Process data for trend lines
  const trendData = React.useMemo(() => {
    const dateMap = new Map<string, Record<string, number>>();
    
    data.forEach(point => {
      if (!dateMap.has(point.date)) {
        dateMap.set(point.date, { date: point.date });
      }
      const dateData = dateMap.get(point.date)!;
      dateData[point.knowledgeArea] = point.proficiency * 33.33;
    });
    
    return Array.from(dateMap.values()).sort((a, b) => 
      new Date(a.date).getTime() - new Date(b.date).getTime()
    );
  }, [data]);

  // Get unique knowledge areas for coloring
  const knowledgeAreas = React.useMemo(() => {
    return Array.from(new Set(data.map(d => d.knowledgeArea)));
  }, [data]);

  const colors = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#06b6d4', '#84cc16', '#f97316'];

  const RadarTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-3">
          <p className="text-sm font-semibold text-gray-900">{data.knowledgeArea}</p>
          <p className="text-sm text-blue-600">
            熟练度: {data.proficiency.toFixed(1)}%
          </p>
        </div>
      );
    }
    return null;
  };

  const TrendTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-3 max-w-xs">
          <p className="text-sm font-semibold text-gray-900 mb-2">
            {new Date(label).toLocaleDateString('zh-CN')}
          </p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.dataKey}: {entry.value?.toFixed(1)}%
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  const renderChart = () => {
    if (viewType === 'radar') {
      return (
        <ResponsiveContainer width="100%" height={height}>
          <RadarChart data={radarData}>
            <PolarGrid />
            <PolarAngleAxis dataKey="knowledgeArea" tick={{ fontSize: 12 }} />
            <PolarRadiusAxis 
              angle={0} 
              domain={[0, 100]} 
              tick={{ fontSize: 10 }}
              tickFormatter={(value) => `${value}%`}
            />
            <Radar
              name="熟练度"
              dataKey="proficiency"
              stroke="#3b82f6"
              fill="#3b82f6"
              fillOpacity={0.3}
              strokeWidth={2}
            />
            <Tooltip content={<RadarTooltip />} />
          </RadarChart>
        </ResponsiveContainer>
      );
    } else {
      return (
        <ResponsiveContainer width="100%" height={height}>
          <LineChart data={trendData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis 
              dataKey="date"
              tick={{ fontSize: 12 }}
              tickFormatter={(value) => new Date(value).toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' })}
            />
            <YAxis 
              domain={[0, 100]}
              tick={{ fontSize: 12 }}
              label={{ value: '熟练度 (%)', angle: -90, position: 'insideLeft' }}
            />
            <Tooltip content={<TrendTooltip />} />
            <Legend />
            {knowledgeAreas.map((area, index) => (
              <Line
                key={area}
                type="monotone"
                dataKey={area}
                stroke={colors[index % colors.length]}
                strokeWidth={2}
                dot={{ fill: colors[index % colors.length], strokeWidth: 2, r: 4 }}
                connectNulls={false}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      );
    }
  };

  if (data.length === 0) {
    return (
      <div className={`card ${className}`}>
        <div className="p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">知识领域掌握度</h3>
          <div className="text-center py-8">
            <Brain className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">暂无知识领域数据</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`card ${className}`}>
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <Brain className="w-6 h-6 text-blue-600 mr-3" />
            <h3 className="text-lg font-bold text-gray-900">知识领域掌握度</h3>
          </div>
          
          {/* View Type Toggle */}
          <div className="flex space-x-1 bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setViewType('radar')}
              className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-all ${
                viewType === 'radar'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              <span>雷达图</span>
            </button>
            <button
              onClick={() => setViewType('trend')}
              className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-all ${
                viewType === 'trend'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <TrendingUp className="w-4 h-4" />
              <span>趋势图</span>
            </button>
          </div>
        </div>
        
        {/* Chart Content */}
        <div>
          {renderChart()}
        </div>
        
        {/* Summary Stats */}
        <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t border-gray-200">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">
              {knowledgeAreas.length}
            </div>
            <div className="text-sm text-gray-600">知识领域</div>
          </div>
          
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              {radarData.length > 0 
                ? Math.round(radarData.reduce((sum, d) => sum + d.proficiency, 0) / radarData.length)
                : 0}%
            </div>
            <div className="text-sm text-gray-600">平均熟练度</div>
          </div>
          
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">
              {radarData.filter(d => d.proficiency >= 80).length}
            </div>
            <div className="text-sm text-gray-600">优秀领域</div>
          </div>
        </div>
      </div>
    </div>
  );
};
