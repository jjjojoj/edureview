import React from 'react';
import { Calendar, Clock } from 'lucide-react';

interface TimeRangeSelectorProps {
  value: '7d' | '30d' | '90d' | '1y' | 'all';
  onChange: (value: '7d' | '30d' | '90d' | '1y' | 'all') => void;
  className?: string;
}

export const TimeRangeSelector: React.FC<TimeRangeSelectorProps> = ({
  value,
  onChange,
  className = "",
}) => {
  const options = [
    { value: '7d' as const, label: '7天' },
    { value: '30d' as const, label: '30天' },
    { value: '90d' as const, label: '90天' },
    { value: '1y' as const, label: '1年' },
    { value: 'all' as const, label: '全部' },
  ];

  return (
    <div className={`flex items-center space-x-1 bg-gray-100 rounded-lg p-1 ${className}`}>
      <div className="flex items-center text-gray-600 mr-2 px-2">
        <Clock className="w-4 h-4 mr-1" />
        <span className="text-sm font-medium">时间范围:</span>
      </div>
      {options.map((option) => (
        <button
          key={option.value}
          onClick={() => onChange(option.value)}
          className={`px-3 py-1 rounded-md text-sm font-medium transition-all ${
            value === option.value
              ? 'bg-white text-blue-600 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
};
