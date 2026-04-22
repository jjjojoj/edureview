import {
  Upload,
  Brain,
  Loader2,
  CheckCircle,
  Pause,
  Play,
  AlertCircle,
} from "lucide-react";

interface UploadSubmitSectionProps {
  uploadType: "assignment" | "exam";
  files: Array<{ id: string }>;
  queueStatus: "idle" | "running" | "paused" | "completed";
  completedCount: number;
  onPause: () => void;
  onResume: () => void;
}

export function UploadSubmitSection({
  uploadType,
  files,
  queueStatus,
  completedCount,
  onPause,
  onResume,
}: UploadSubmitSectionProps) {
  return (
    <div className="space-y-3">
      {files.length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
          <div className="flex items-start">
            <AlertCircle className="w-5 h-5 text-yellow-600 mr-2 mt-0.5" />
            <div className="text-sm text-yellow-800">
              <p className="font-medium mb-1">上传前检查清单：</p>
              <ul className="list-disc list-inside space-y-1 text-xs">
                <li>确保图片中学生姓名清晰可见</li>
                <li>检查作业标题和描述是否正确</li>
                <li>确认AI模型和置信度设置</li>
                <li>
                  预计处理时间：约 {files.length * 15} 秒
                </li>
              </ul>
            </div>
          </div>
        </div>
      )}

      <div className="flex space-x-3">
        <button
          type="submit"
          disabled={files.length === 0 || queueStatus === "running"}
          className="flex-1 bg-gradient-to-r from-blue-500 to-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:from-blue-600 hover:to-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {queueStatus === "running" ? (
            <>
              <Brain className="w-4 h-4 inline mr-2 animate-pulse" />
              Processing... ({completedCount}/{files.length})
            </>
          ) : queueStatus === "completed" ? (
            <>
              <CheckCircle className="w-4 h-4 inline mr-2" />
              All Complete
            </>
          ) : (
            <>
              <Upload className="w-4 h-4 inline mr-2" />
              Start Batch Upload & Analysis ({files.length} files)
            </>
          )}
        </button>

        {queueStatus === "running" && (
          <button
            type="button"
            onClick={onPause}
            className="px-4 py-3 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors"
          >
            <Pause className="w-4 h-4" />
          </button>
        )}

        {queueStatus === "paused" && (
          <button
            type="button"
            onClick={onResume}
            className="px-4 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
          >
            <Play className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
}
