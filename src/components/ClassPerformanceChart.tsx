import React, { useState } from 'react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { Users, FileText, Award, Target, TrendingUp } from 'lucide-react';

interface ClassPerformanceData {
  performanceTrends: Array<{
    date: string;
    averageScore: number;
    count: number;
    type: 'assignment' | 'exam';
  }>;
  participationTrends: Array<{
    date: string;
    activeStudents: number;
    participationRate: number;
  }>;
  mistakeTrends: Array<{
    date: string;
    mistakes: number;
  }>;
}

interface ClassPerformanceChartProps {
  data: ClassPerformanceData;
  className?: string;
  height?: number;
}

export const ClassPerformanceChart: React.FC<ClassPerformanceChartProps> = ({
  data,
  className = "",
  height = 350,
}) => {
  const [activeTab, setActiveTab] = useState<'performance' | 'participation' | 'mistakes'>('performance');

  // Process performance data for combined view
  const combinedPerformanceData = React.useMemo(() => {
    const dateMap = new Map<string, { date: string; assignment?: number; exam?: number; }>();
    
    data.performanceTrends.forEach(trend => {
      const existing = dateMap.get(trend.date) || { date: trend.date };
      if (trend.type === 'assignment') {
        existing.assignment = trend.averageScore;
      } else {
        existing.exam = trend.averageScore;
      }
      dateMap.set(trend.date, existing);
    });
    
    return Array.from(dateMap.values()).sort((a, b) => 
      new Date(a.date).getTime() - new Date(b.date).getTime()
    );
  }, [data.performanceTrends]);

  const tabs = [
    { id: 'performance', label: '成绩趋势', icon: TrendingUp },
    { id: 'participation', label: '参与度', icon: Users },
    { id: 'mistakes', label: '错误分析', icon: Target },
  ];

  const PerformanceTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-3">
          <p className="text-sm font-semibold text-gray-900 mb-2">
            {new Date(label).toLocaleDateString('zh-CN')}
          </p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.dataKey === 'assignment' ? '平均作业分数' : 
               entry.dataKey === 'exam' ? '平均考试分数' :
               entry.dataKey === 'participationRate' ? '参与率' :
               entry.dataKey === 'mistakes' ? '错误数' : entry.dataKey}: {entry.value}
               {entry.dataKey === 'participationRate' ? '%' : entry.dataKey === 'mistakes' ? '个' : '分'}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  const renderChart = () => {
    switch (activeTab) {
      case 'performance':
        return (
          <ResponsiveContainer width="100%" height={height}>
            <AreaChart data={combinedPerformanceData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis 
                dataKey="date"
                tick={{ fontSize: 12 }}
                tickFormatter={(value) => new Date(value).toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' })}
              />
              <YAxis 
                domain={[0, 100]}
                tick={{ fontSize: 12 }}
                label={{ value: '平均分', angle: -90, position: 'insideLeft' }}
              />
              <Tooltip content={<PerformanceTooltip />} />
              <Legend formatter={(value) => value === 'assignment' ? '作业平均分' : '考试平均分'} />
              <Area
                type="monotone"
                dataKey="assignment"
                stackId="1"
                stroke="#3b82f6"
                fill="#3b82f6"
                fillOpacity={0.3}
              />
              <Area
                type="monotone"
                dataKey="exam"
                stackId="2"
                stroke="#8b5cf6"
                fill="#8b5cf6"
                fillOpacity={0.3}
              />
            </AreaChart>
          </ResponsiveContainer>
        );
        
      case 'participation':
        return (
          <ResponsiveContainer width="100%" height={height}>
            <AreaChart data={data.participationTrends}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis 
                dataKey="date"
                tick={{ fontSize: 12 }}
                tickFormatter={(value) => new Date(value).toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' })}
              />
              <YAxis 
                domain={[0, 100]}
                tick={{ fontSize: 12 }}
                label={{ value: '参与率 (%)', angle: -90, position: 'insideLeft' }}
              />
              <Tooltip content={<PerformanceTooltip />} />
              <Legend formatter={() => '班级参与率'} />
              <Area
                type="monotone"
                dataKey="participationRate"
                stroke="#10b981"
                fill="#10b981"
                fillOpacity={0.3}
              />
            </AreaChart>
          </ResponsiveContainer>
        );
        
      case 'mistakes':
        return (
          <ResponsiveContainer width="100%" height={height}>
            <BarChart data={data.mistakeTrends}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis 
                dataKey="date"
                tick={{ fontSize: 12 }}
                tickFormatter={(value) => new Date(value).toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' })}
              />
              <YAxis 
                tick={{ fontSize: 12 }}
                label={{ value: '错误数量', angle: -90, position: 'insideLeft' }}
              />
              <Tooltip content={<PerformanceTooltip />} />
              <Legend formatter={() => '每日错误数'} />
              <Bar dataKey="mistakes" fill="#f59e0b" />
            </BarChart>
          </ResponsiveContainer>
        );
        
      default:
        return null;
    }
  };

  return (
    <div className={`card ${className}`}>
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-bold text-gray-900">班级表现分析</h3>
          
          {/* Tab Navigation */}
          <div className="flex space-x-1 bg-gray-100 rounded-lg p-1">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-all ${
                    activeTab === tab.id
                      ? 'bg-white text-blue-600 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
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
              {activeTab === 'performance' 
                ? combinedPerformanceData.length > 0
                  ? Math.round(combinedPerformanceData.reduce((sum, d) => sum + (d.assignment || 0) + (d.exam || 0), 0) / (combinedPerformanceData.length * 2))
                  : 0
                : activeTab === 'participation'
                ? data.participationTrends.length > 0
                  ? Math.round(data.participationTrends.reduce((sum, d) => sum + d.participationRate, 0) / data.participationTrends.length)
                  : 0
                : data.mistakeTrends.reduce((sum, d) => sum + d.mistakes, 0)
              }
              {activeTab === 'participation' ? '%' : activeTab === 'mistakes' ? '个' : '分'}
            </div>
            <div className="text-sm text-gray-600">
              {activeTab === 'performance' ? '平均成绩' : 
               activeTab === 'participation' ? '平均参与率' : '总错误数'}
            </div>
          </div>
          
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              {activeTab === 'performance' 
                ? data.performanceTrends.filter(t => t.type === 'assignment').length
                : activeTab === 'participation'
                ? data.participationTrends.length
                : data.mistakeTrends.length
              }
            </div>
            <div className="text-sm text-gray-600">
              {activeTab === 'performance' ? '作业次数' : 
               activeTab === 'participation' ? '活跃天数' : '错误天数'}
            </div>
          </div>
          
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">
              {activeTab === 'performance' 
                ? data.performanceTrends.filter(t => t.type === 'exam').length
                : activeTab === 'participation'
                ? Math.round(data.participationTrends.reduce((sum, d) => sum + d.activeStudents, 0) / Math.max(data.participationTrends.length, 1))
                : data.mistakeTrends.length > 0
                ? Math.round(data.mistakeTrends.reduce((sum, d) => sum + d.mistakes, 0) / data.mistakeTrends.length)
                : 0
              }
            </div>
            <div className="text-sm text-gray-600">
              {activeTab === 'performance' ? '考试次数' : 
               activeTab === 'participation' ? '平均活跃学生' : '平均每日错误'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
