import {
  FileText,
  Loader2,
  CheckCircle,
  AlertCircle,
  X,
  RotateCcw,
  Image,
  Pause,
  Trash2,
} from "lucide-react";
import type { AssignmentFile } from "./types";

interface ParentFileListProps {
  files: AssignmentFile[];
  maxFiles: number;
  queueStatus: string;
  completedCount: number;
  onRemoveFile: (fileId: string) => void;
  onClearCompleted: () => void;
  onRetryFile: (fileId: string) => void;
}

const getStatusColor = (status: AssignmentFile['status']) => {
  switch (status) {
    case "complete": return "text-green-600";
    case "error": return "text-red-600";
    case "uploading":
    case "processing":
    case "analyzing": return "text-blue-600";
    case "compressing": return "text-yellow-600";
    case "paused": return "text-gray-600";
    default: return "text-gray-500";
  }
};

const getStatusIcon = (status: AssignmentFile['status']) => {
  switch (status) {
    case "complete": return <CheckCircle className="w-4 h-4" />;
    case "error": return <AlertCircle className="w-4 h-4" />;
    case "uploading":
    case "processing":
    case "analyzing": return <Loader2 className="w-4 h-4 animate-spin" />;
    case "compressing": return <Image className="w-4 h-4 animate-pulse" />;
    case "paused": return <Pause className="w-4 h-4" />;
    default: return <FileText className="w-4 h-4" />;
  }
};

export function ParentFileList({
  files,
  maxFiles,
  queueStatus,
  completedCount,
  onRemoveFile,
  onClearCompleted,
  onRetryFile,
}: ParentFileListProps) {
  return (
    <>
      {files.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-medium text-gray-900">
              已选择的文件 ({files.length}/{maxFiles})
            </h4>

            {files.some(f => f.status === "complete") && (
              <button
                type="button"
                onClick={onClearCompleted}
                className="text-sm text-gray-600 hover:text-gray-800 flex items-center"
              >
                <Trash2 className="w-4 h-4 mr-1" />
                清除已完成
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-96 overflow-y-auto">
            {files.map((file) => (
              <div key={file.id} className="border border-gray-200 rounded-lg p-4 space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2">
                      <div className={`${getStatusColor(file.status)}`}>
                        {getStatusIcon(file.status)}
                      </div>
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {file.file.name}
                      </p>
                    </div>

                    <div className="flex items-center text-xs text-gray-500 mt-1">
                      <span>{(file.file.size / 1024 / 1024).toFixed(2)} MB</span>
                      {file.compressedFile && (
                        <span className="ml-2 text-green-600">
                          → {(file.compressedFile.size / 1024 / 1024).toFixed(2)} MB
                        </span>
                      )}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => onRemoveFile(file.id)}
                    className="p-1 text-gray-400 hover:text-red-600 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Preview Image */}
                <div className="relative">
                  <img
                    src={file.previewUrl}
                    alt="Preview"
                    className="w-full h-24 object-cover rounded-lg border border-gray-200"
                  />
                  {file.status !== "pending" && (
                    <div className="absolute inset-0 bg-black bg-opacity-40 rounded-lg flex items-center justify-center">
                      <div className={`${getStatusColor(file.status)} bg-white rounded-full p-2`}>
                        {getStatusIcon(file.status)}
                      </div>
                    </div>
                  )}
                </div>

                {/* Progress Bar */}
                {file.status !== "pending" && file.status !== "complete" && file.status !== "error" && (
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-pink-600 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${file.progress}%` }}
                    />
                  </div>
                )}

                {/* Error Message & Retry */}
                {file.status === "error" && (
                  <div className="space-y-2">
                    <p className="text-xs text-red-600">{file.error}</p>
                    {file.retryCount < 3 && (
                      <button
                        type="button"
                        onClick={() => onRetryFile(file.id)}
                        className="text-xs text-blue-600 hover:text-blue-800 flex items-center"
                      >
                        <RotateCcw className="w-3 h-3 mr-1" />
                        重试 ({file.retryCount}/3)
                      </button>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Queue Status */}
      {queueStatus !== "idle" && (
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center">
              {queueStatus === "running" && <Loader2 className="w-5 h-5 animate-spin text-blue-600 mr-2" />}
              {queueStatus === "paused" && <Pause className="w-5 h-5 text-yellow-600 mr-2" />}
              {queueStatus === "completed" && <CheckCircle className="w-5 h-5 text-green-600 mr-2" />}

              <span className="text-sm font-medium text-gray-700">
                {queueStatus === "running" && "正在处理上传队列..."}
                {queueStatus === "paused" && "上传队列已暂停"}
                {queueStatus === "completed" && "上传队列已完成"}
              </span>
            </div>

            <span className="text-sm text-gray-500">
              {completedCount}/{files.length} 已完成
            </span>
          </div>

          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-pink-600 h-2 rounded-full transition-all duration-500"
              style={{ width: `${files.length > 0 ? (completedCount / files.length) * 100 : 0}%` }}
            />
          </div>
        </div>
      )}
    </>
  );
}
