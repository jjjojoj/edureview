import { useState, useRef } from "react";
import {
  Camera,
  Brain,
  FileSpreadsheet,
  FileText,
  Loader2,
} from "lucide-react";
import { useToast } from "~/components/Toast";

export type InputMode = "image" | "file" | "text";

export interface ImportParams {
  inputMode: InputMode;
  file: File | null;
  text: string;
  model: string;
}

interface StudentImportZoneProps {
  onImport: (params: ImportParams) => void;
  isAnalyzing: boolean;
  onCancel: () => void;
}

const availableModels = [
  {
    key: "siliconcloud/qwen2.5-vl-7b",
    name: "Qwen2.5-VL-7B (推荐)",
    description: "高性价比，准确度良好",
  },
  {
    key: "alibaba-bailian/qwen-vl-max",
    name: "Qwen VL Max (高级)",
    description: "最高准确度，适合复杂图片",
  },
];

export function StudentImportZone({
  onImport,
  isAnalyzing,
  onCancel,
}: StudentImportZoneProps) {
  const toast = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [selectedModel, setSelectedModel] = useState(
    "siliconcloud/qwen2.5-vl-7b",
  );
  const [inputMode, setInputMode] = useState<InputMode>("image");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>("");
  const [textInput, setTextInput] = useState<string>("");

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (inputMode === "image") {
      if (!file.type.startsWith("image/")) {
        toast.error("请选择图片文件");
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        toast.error("图片文件不能超过10MB");
        return;
      }
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    } else if (inputMode === "file") {
      const validTypes = [
        "text/csv",
        "application/vnd.ms-excel",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      ];
      const validExtensions = [".csv", ".xls", ".xlsx"];
      const hasValidType = validTypes.includes(file.type);
      const hasValidExtension = validExtensions.some((ext) =>
        file.name.toLowerCase().endsWith(ext),
      );

      if (!hasValidType && !hasValidExtension) {
        toast.error("请选择CSV或Excel文件");
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        toast.error("文件不能超过5MB");
        return;
      }
      setSelectedFile(file);
      setPreviewUrl("");
    }
  };

  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault();
    const file = event.dataTransfer.files[0];
    if (file) {
      const input = fileInputRef.current;
      if (input) {
        const dt = new DataTransfer();
        dt.items.add(file);
        input.files = dt.files;
        handleFileSelect({
          target: input,
        } as React.ChangeEvent<HTMLInputElement>);
      }
    }
  };

  const handleAnalyze = () => {
    if (inputMode === "image" && !selectedFile) {
      toast.error("请选择图片文件");
      return;
    }
    if (inputMode === "file" && !selectedFile) {
      toast.error("请选择CSV或Excel文件");
      return;
    }
    if (inputMode === "text" && !textInput.trim()) {
      toast.error("请输入学生名单");
      return;
    }
    onImport({ inputMode, file: selectedFile, text: textInput, model: selectedModel });
  };

  return (
    <div className="px-8 py-6">
      <div className="space-y-6">
        {/* Model Selection */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-3">
            选择AI模型
          </label>
          <div className="space-y-2">
            {availableModels.map((model) => (
              <label
                key={model.key}
                className="flex items-start space-x-3 cursor-pointer"
              >
                <input
                  type="radio"
                  name="aiModel"
                  value={model.key}
                  checked={selectedModel === model.key}
                  onChange={(e) => setSelectedModel(e.target.value)}
                  className="mt-1"
                />
                <div className="flex-1">
                  <div className="text-sm font-medium text-gray-900">
                    {model.name}
                  </div>
                  <div className="text-xs text-gray-500">
                    {model.description}
                  </div>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Input Mode Selection */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-3">
            🎯 选择输入方式
          </label>
          <div className="grid grid-cols-3 gap-3 mb-4">
            <button
              type="button"
              onClick={() => {
                setInputMode("image");
                setSelectedFile(null);
                setPreviewUrl("");
              }}
              className={`p-3 rounded-lg border-2 text-center transition-all ${
                inputMode === "image"
                  ? "border-blue-500 bg-blue-50 text-blue-700"
                  : "border-gray-300 bg-white text-gray-600 hover:border-blue-300"
              }`}
            >
              <Camera className="w-6 h-6 mx-auto mb-2" />
              <div className="text-sm font-medium">图片上传</div>
              <div className="text-xs text-gray-500">AI智能识别</div>
            </button>
            <button
              type="button"
              onClick={() => {
                setInputMode("file");
                setSelectedFile(null);
                setPreviewUrl("");
              }}
              className={`p-3 rounded-lg border-2 text-center transition-all ${
                inputMode === "file"
                  ? "border-blue-500 bg-blue-50 text-blue-700"
                  : "border-gray-300 bg-white text-gray-600 hover:border-blue-300"
              }`}
            >
              <FileSpreadsheet className="w-6 h-6 mx-auto mb-2" />
              <div className="text-sm font-medium">文件上传</div>
              <div className="text-xs text-gray-500">CSV/Excel文件</div>
            </button>
            <button
              type="button"
              onClick={() => setInputMode("text")}
              className={`p-3 rounded-lg border-2 text-center transition-all ${
                inputMode === "text"
                  ? "border-blue-500 bg-blue-50 text-blue-700"
                  : "border-gray-300 bg-white text-gray-600 hover:border-blue-300"
              }`}
            >
              <FileText className="w-6 h-6 mx-auto mb-2" />
              <div className="text-sm font-medium">文字输入</div>
              <div className="text-xs text-gray-500">复制粘贴</div>
            </button>
          </div>
        </div>

        {/* Image Upload Zone */}
        {inputMode === "image" && (
          <div
            className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-blue-400 transition-colors cursor-pointer"
            onDrop={handleDrop}
            onDragOver={(e) => e.preventDefault()}
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
            />

            {selectedFile && previewUrl ? (
              <div className="space-y-4">
                <img
                  src={previewUrl}
                  alt="Preview"
                  className="max-h-48 mx-auto rounded-lg shadow-md"
                />
                <div className="text-sm text-gray-600">
                  已选择: {selectedFile.name}
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="w-16 h-16 bg-blue-100 rounded-full mx-auto flex items-center justify-center">
                  <Camera className="w-8 h-8 text-blue-600" />
                </div>
                <div>
                  <p className="text-lg font-medium text-gray-900">
                    上传学生名单图片
                  </p>
                  <p className="text-sm text-gray-500 mt-1">
                    支持JPG、PNG格式，建议小于5MB
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* File Upload Zone */}
        {inputMode === "file" && (
          <div
            className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-blue-400 transition-colors cursor-pointer"
            onDrop={handleDrop}
            onDragOver={(e) => e.preventDefault()}
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,.xls,.xlsx"
              onChange={handleFileSelect}
              className="hidden"
            />

            {selectedFile ? (
              <div className="space-y-4">
                <div className="w-16 h-16 bg-green-100 rounded-full mx-auto flex items-center justify-center">
                  <FileSpreadsheet className="w-8 h-8 text-green-600" />
                </div>
                <div className="text-sm text-gray-600">
                  已选择: {selectedFile.name}
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="w-16 h-16 bg-green-100 rounded-full mx-auto flex items-center justify-center">
                  <FileSpreadsheet className="w-8 h-8 text-green-600" />
                </div>
                <div>
                  <p className="text-lg font-medium text-gray-900">
                    上传CSV或Excel文件
                  </p>
                  <p className="text-sm text-gray-500 mt-1">
                    支持.csv, .xls, .xlsx格式，建议小于5MB
                  </p>
                  <div className="text-xs mt-3">
                    <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                      <p className="font-medium text-green-900 mb-2">
                        📊 支持的文件格式：
                      </p>
                      <ul className="text-green-800 space-y-1 text-left">
                        <li>• CSV文件：姓名，学号（逗号分隔）</li>
                        <li>• Excel文件：第一列姓名，第二列学号</li>
                        <li>
                          • 自动识别表头行（姓名/name, 学号/id）
                        </li>
                        <li>• 智能处理空学号，自动分配编号</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Text Input Zone */}
        {inputMode === "text" && (
          <div className="border-2 border-gray-300 rounded-xl p-6">
            <div className="space-y-4">
              <div className="flex items-center">
                <FileText className="w-6 h-6 text-purple-600 mr-3" />
                <p className="text-lg font-medium text-gray-900">
                  文本输入学生名单
                </p>
              </div>

              <textarea
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                placeholder={
                  "请输入学生名单，支持多种格式：\n张三 001\n李四 002\n王五\n1. 赵六\n陈七(003)"
                }
                className="w-full h-48 p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
              />

              <div className="text-xs space-y-2">
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
                  <p className="font-medium text-purple-900 mb-2">
                    📝 支持的文本格式：
                  </p>
                  <ul className="text-purple-800 space-y-1 text-left">
                    <li>• 姓名 学号：张三 001</li>
                    <li>• 学号 姓名：001 张三</li>
                    <li>• 带序号：1. 张三 或 1、张三</li>
                    <li>• 括号格式：张三(001) 或 张三（001）</li>
                    <li>• 纯姓名：张三（每行一个）</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex space-x-4">
          <button
            type="button"
            onClick={onCancel}
            className="btn-secondary flex-1"
          >
            取消
          </button>
          <button
            onClick={handleAnalyze}
            disabled={
              (inputMode === "image" && !selectedFile) ||
              (inputMode === "file" && !selectedFile) ||
              (inputMode === "text" && !textInput.trim()) ||
              isAnalyzing
            }
            className="btn-primary flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isAnalyzing ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                处理中...
              </>
            ) : (
              <>
                {inputMode === "image" && (
                  <Brain className="w-5 h-5 mr-2" />
                )}
                {inputMode === "file" && (
                  <FileSpreadsheet className="w-5 h-5 mr-2" />
                )}
                {inputMode === "text" && (
                  <FileText className="w-5 h-5 mr-2" />
                )}
                {inputMode === "image" && "开始AI分析"}
                {inputMode === "file" && "解析文件"}
                {inputMode === "text" && "解析文本"}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
