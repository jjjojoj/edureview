import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useTRPC } from '~/trpc/react';
import { useAuthStore } from '~/stores/authStore';
import { 
  X, 
  FileText, 
  Download, 
  Loader2, 
  CheckCircle, 
  AlertCircle,
  Calendar,
  BarChart3,
  Users,
  Brain,
  FileSpreadsheet
} from 'lucide-react';
import toast from 'react-hot-toast';

interface ReportGenerationModalProps {
  isOpen: boolean;
  onClose: () => void;
  classId: number;
  className: string;
}

export const ReportGenerationModal: React.FC<ReportGenerationModalProps> = ({
  isOpen,
  onClose,
  classId,
  className,
}) => {
  const { authToken } = useAuthStore();
  const trpc = useTRPC();
  
  const [reportType, setReportType] = useState<'pdf' | 'excel'>('pdf');
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d' | '1y' | 'all'>('30d');
  const [options, setOptions] = useState({
    includeStudentDetails: true,
    includePerformanceCharts: true,
    includeAIInsights: true,
    includeDetailedScores: true,
    includeMistakeAnalysis: true,
  });
  
  const [generatedReport, setGeneratedReport] = useState<{
    downloadUrl: string;
    fileName: string;
    fileSize: number;
  } | null>(null);

  const generatePdfMutation = useMutation(trpc.generateClassReportPdf.mutationOptions());
  const generateExcelMutation = useMutation(trpc.generateClassReportExcel.mutationOptions());

  const isGenerating = generatePdfMutation.isPending || generateExcelMutation.isPending;

  const handleGenerateReport = async () => {
    if (!authToken) {
      toast.error('请先登录');
      return;
    }

    try {
      let result;
      
      if (reportType === 'pdf') {
        result = await generatePdfMutation.mutateAsync({
          authToken,
          classId,
          timeRange,
          includeStudentDetails: options.includeStudentDetails,
          includePerformanceCharts: options.includePerformanceCharts,
          includeAIInsights: options.includeAIInsights,
        });
      } else {
        result = await generateExcelMutation.mutateAsync({
          authToken,
          classId,
          timeRange,
          includeDetailedScores: options.includeDetailedScores,
          includeMistakeAnalysis: options.includeMistakeAnalysis,
        });
      }

      setGeneratedReport({
        downloadUrl: result.downloadUrl,
        fileName: result.fileName,
        fileSize: result.fileSize,
      });
      
      toast.success(`${reportType === 'pdf' ? 'PDF' : 'Excel'}报告生成成功！`);
    } catch (error: any) {
      toast.error(error.message || '生成报告失败');
    }
  };

  const handleDownload = () => {
    if (generatedReport) {
      window.open(generatedReport.downloadUrl, '_blank');
      toast.success('开始下载报告');
    }
  };

  const handleClose = () => {
    setGeneratedReport(null);
    setOptions({
      includeStudentDetails: true,
      includePerformanceCharts: true,
      includeAIInsights: true,
      includeDetailedScores: true,
      includeMistakeAnalysis: true,
    });
    setTimeRange('30d');
    setReportType('pdf');
    onClose();
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center mr-3">
              <BarChart3 className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900">生成报告</h3>
              <p className="text-sm text-gray-500">{className}</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-2 text-gray-400 hover:text-gray-600 rounded-xl hover:bg-gray-100 transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Report Type Selection */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-3">报告格式</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setReportType('pdf')}
                className={`p-4 rounded-xl border-2 transition-all ${
                  reportType === 'pdf'
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center justify-center mb-2">
                  <FileText className="w-8 h-8" />
                </div>
                <div className="font-semibold">PDF 报告</div>
                <div className="text-sm text-gray-500 mt-1">适合打印和展示</div>
              </button>
              
              <button
                onClick={() => setReportType('excel')}
                className={`p-4 rounded-xl border-2 transition-all ${
                  reportType === 'excel'
                    ? 'border-green-500 bg-green-50 text-green-700'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center justify-center mb-2">
                  <FileSpreadsheet className="w-8 h-8" />
                </div>
                <div className="font-semibold">Excel 表格</div>
                <div className="text-sm text-gray-500 mt-1">适合数据分析</div>
              </button>
            </div>
          </div>

          {/* Time Range Selection */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-3">时间范围</label>
            <div className="flex items-center space-x-1 bg-gray-100 rounded-lg p-1">
              {[
                { value: '7d' as const, label: '7天' },
                { value: '30d' as const, label: '30天' },
                { value: '90d' as const, label: '90天' },
                { value: '1y' as const, label: '1年' },
                { value: 'all' as const, label: '全部' },
              ].map((option) => (
                <button
                  key={option.value}
                  onClick={() => setTimeRange(option.value)}
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-all flex-1 ${
                    timeRange === option.value
                      ? 'bg-white text-blue-600 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          {/* Options */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-3">包含内容</label>
            <div className="space-y-3">
              {reportType === 'pdf' ? (
                <>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={options.includeStudentDetails}
                      onChange={(e) => setOptions(prev => ({ ...prev, includeStudentDetails: e.target.checked }))}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <div className="ml-3">
                      <div className="flex items-center">
                        <Users className="w-4 h-4 mr-2 text-gray-500" />
                        <span className="text-sm font-medium text-gray-700">学生详情</span>
                      </div>
                      <p className="text-xs text-gray-500 ml-6">包含每个学生的基本信息和统计数据</p>
                    </div>
                  </label>
                  
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={options.includePerformanceCharts}
                      onChange={(e) => setOptions(prev => ({ ...prev, includePerformanceCharts: e.target.checked }))}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <div className="ml-3">
                      <div className="flex items-center">
                        <BarChart3 className="w-4 h-4 mr-2 text-gray-500" />
                        <span className="text-sm font-medium text-gray-700">表现图表</span>
                      </div>
                      <p className="text-xs text-gray-500 ml-6">包含班级表现趋势图和统计图表</p>
                    </div>
                  </label>
                  
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={options.includeAIInsights}
                      onChange={(e) => setOptions(prev => ({ ...prev, includeAIInsights: e.target.checked }))}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <div className="ml-3">
                      <div className="flex items-center">
                        <Brain className="w-4 h-4 mr-2 text-gray-500" />
                        <span className="text-sm font-medium text-gray-700">AI 分析洞察</span>
                      </div>
                      <p className="text-xs text-gray-500 ml-6">包含AI生成的班级分析和建议</p>
                    </div>
                  </label>
                </>
              ) : (
                <>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={options.includeDetailedScores}
                      onChange={(e) => setOptions(prev => ({ ...prev, includeDetailedScores: e.target.checked }))}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <div className="ml-3">
                      <div className="flex items-center">
                        <BarChart3 className="w-4 h-4 mr-2 text-gray-500" />
                        <span className="text-sm font-medium text-gray-700">详细成绩</span>
                      </div>
                      <p className="text-xs text-gray-500 ml-6">包含每次作业和考试的详细分数</p>
                    </div>
                  </label>
                  
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={options.includeMistakeAnalysis}
                      onChange={(e) => setOptions(prev => ({ ...prev, includeMistakeAnalysis: e.target.checked }))}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <div className="ml-3">
                      <div className="flex items-center">
                        <AlertCircle className="w-4 h-4 mr-2 text-gray-500" />
                        <span className="text-sm font-medium text-gray-700">错误分析</span>
                      </div>
                      <p className="text-xs text-gray-500 ml-6">包含详细的错误记录和知识点分析</p>
                    </div>
                  </label>
                </>
              )}
            </div>
          </div>

          {/* Generated Report Display */}
          {generatedReport && (
            <div className="bg-green-50 border border-green-200 rounded-xl p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <CheckCircle className="w-6 h-6 text-green-600 mr-3" />
                  <div>
                    <div className="font-semibold text-green-900">报告生成成功</div>
                    <div className="text-sm text-green-700">
                      {generatedReport.fileName} ({formatFileSize(generatedReport.fileSize)})
                    </div>
                  </div>
                </div>
                <button
                  onClick={handleDownload}
                  className="btn-primary text-sm"
                >
                  <Download className="w-4 h-4 mr-2" />
                  下载
                </button>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200">
            <button
              onClick={handleClose}
              className="btn-secondary"
              disabled={isGenerating}
            >
              取消
            </button>
            <button
              onClick={handleGenerateReport}
              disabled={isGenerating}
              className="btn-primary"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  生成中...
                </>
              ) : (
                <>
                  <FileText className="w-4 h-4 mr-2" />
                  生成报告
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
