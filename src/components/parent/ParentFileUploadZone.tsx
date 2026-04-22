import { useRef } from "react";
import {
  Upload,
  Camera,
  Plus,
} from "lucide-react";

interface ParentFileUploadZoneProps {
  dragActive: boolean;
  onDrag: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent) => void;
  onFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onStartCamera: () => void;
  maxFiles: number;
  allowMultiple: boolean;
}

export function ParentFileUploadZone({
  dragActive,
  onDrag,
  onDrop,
  onFileSelect,
  onStartCamera,
  maxFiles,
  allowMultiple,
}: ParentFileUploadZoneProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-3">
        作业图片 {allowMultiple && `(最多 ${maxFiles} 个文件)`}
      </label>

      <div
        className={`border-2 border-dashed rounded-lg p-8 text-center transition-all cursor-pointer ${
          dragActive
            ? 'border-pink-400 bg-pink-50'
            : 'border-gray-300 hover:border-pink-400 hover:bg-pink-50'
        }`}
        onDragEnter={onDrag}
        onDragLeave={onDrag}
        onDragOver={onDrag}
        onDrop={onDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        <div className="flex flex-col items-center space-y-4">
          <div className="flex space-x-4">
            <Camera className="w-12 h-12 text-gray-400 hover:text-pink-600 transition-colors" />
            <Upload className="w-12 h-12 text-gray-400 hover:text-pink-600 transition-colors" />
          </div>

          <div>
            <h4 className="text-lg font-medium text-gray-900 mb-2">
              拖拽文件到此处或点击选择
            </h4>
            <p className="text-gray-500 mb-4">
              支持 JPG、PNG、GIF、WebP 格式，自动压缩优化
            </p>

            <div className="flex flex-wrap justify-center gap-2">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  fileInputRef.current?.click();
                }}
                className="px-4 py-2 bg-pink-100 text-pink-700 rounded-lg hover:bg-pink-200 transition-colors flex items-center"
              >
                <Plus className="w-4 h-4 mr-2" />
                选择文件
              </button>

              {navigator.mediaDevices && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onStartCamera();
                  }}
                  className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors flex items-center"
                >
                  <Camera className="w-4 h-4 mr-2" />
                  拍照
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
