import { useRef, useCallback } from "react";
import {
  Upload,
  Camera,
  Plus,
  Brain,
  Zap,
  Users,
  ImageIcon,
  CheckCircle,
} from "lucide-react";
interface FileUploadZoneProps {
  dragActive: boolean;
  onDrag: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent) => void;
  onFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onStartCamera: () => void;
  maxFiles: number;
  allowMultiple: boolean;
  uploadType: "assignment" | "exam";
}

export function FileUploadZone({
  dragActive,
  onDrag,
  onDrop,
  onFileSelect,
  onStartCamera,
  maxFiles,
  allowMultiple,
  uploadType,
}: FileUploadZoneProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-3">
        {uploadType === "exam" ? "Exam" : "Assignment"} Images{" "}
        {allowMultiple && `(up to ${maxFiles} files)`}
      </label>

      <div
        className={`border-2 border-dashed rounded-lg p-8 text-center transition-all cursor-pointer ${
          dragActive
            ? "border-blue-400 bg-blue-50"
            : "border-gray-300 hover:border-blue-400 hover:bg-blue-50"
        }`}
        onDragEnter={onDrag}
        onDragLeave={onDrag}
        onDragOver={onDrag}
        onDrop={onDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        <div className="flex flex-col items-center space-y-4">
          <div className="flex space-x-4">
            <Brain className="w-12 h-12 text-gray-400 hover:text-blue-600 transition-colors" />
            <Camera className="w-12 h-12 text-gray-400 hover:text-blue-600 transition-colors" />
            <Upload className="w-12 h-12 text-gray-400 hover:text-blue-600 transition-colors" />
          </div>

          <div>
            <h4 className="text-lg font-medium text-gray-900 mb-2">
              拖拽文件到此处或点击选择
            </h4>
            <p className="text-gray-500 mb-2">
              支持 JPG、PNG、GIF、WebP 格式，自动压缩和AI识别
            </p>
            <div className="text-xs text-gray-400 mb-4 space-y-1">
              <p>💡 提示：确保图片中学生姓名清晰可见，AI识别效果更佳</p>
              <p>📋 建议：一次上传同一次作业的所有学生图片</p>
              <p>🎯 特色：自动识别学生姓名并分配到对应学生档案</p>
            </div>

            <div className="flex flex-wrap justify-center gap-2">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  fileInputRef.current?.click();
                }}
                className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors flex items-center"
              >
                <Plus className="w-4 h-4 mr-2" />
                Select Files
              </button>

              {navigator.mediaDevices && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onStartCamera();
                  }}
                  className="px-4 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors flex items-center"
                >
                  <Camera className="w-4 h-4 mr-2" />
                  Take Photo
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple={allowMultiple}
        onChange={onFileSelect}
        className="hidden"
      />
    </div>
  );
}
