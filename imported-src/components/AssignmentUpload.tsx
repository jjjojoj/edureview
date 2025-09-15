import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { useState, useRef } from "react";
import { useTRPC } from "~/trpc/react";
import { useAuthStore } from "~/stores/authStore";
import { Upload, Camera, FileText, Loader2, CheckCircle, AlertCircle, X } from "lucide-react";
import toast from "react-hot-toast";

const uploadSchema = z.object({
  title: z.string().min(1, "作业标题不能为空"),
  description: z.string().optional(),
});

type UploadFormData = z.infer<typeof uploadSchema>;

interface AssignmentUploadProps {
  childId: number;
  onSuccess?: () => void;
  onClose?: () => void;
}

type UploadStatus = "idle" | "uploading" | "processing" | "analyzing" | "complete" | "error";

export function AssignmentUpload({ childId, onSuccess, onClose }: AssignmentUploadProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadStatus, setUploadStatus] = useState<UploadStatus>("idle");
  const [uploadProgress, setUploadProgress] = useState(0);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const trpc = useTRPC();
  const { authToken } = useAuthStore();

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<UploadFormData>({
    resolver: zodResolver(uploadSchema),
  });

  const uploadMutation = useMutation(trpc.uploadParentAssignment.mutationOptions());
  const analyzeMutation = useMutation(trpc.analyzeAssignment.mutationOptions());
  const presignedUrlMutation = useMutation(trpc.generatePresignedUploadUrl.mutationOptions());

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast.error('请选择图片文件');
        return;
      }

      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        toast.error('文件大小必须小于10MB');
        return;
      }

      setSelectedFile(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreviewUrl(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const uploadFileToOSS = async (file: File): Promise<string> => {
    try {
      // Generate presigned URL
      const urlResponse = await presignedUrlMutation.mutateAsync({
        authToken: authToken!,
        fileName: `parent-${Date.now()}-${file.name}`,
        fileType: file.type,
        folderName: "assignment-uploads",
      });

      // Upload file directly to OSS
      const uploadResponse = await fetch(urlResponse.presignedUrl, {
        method: 'PUT',
        body: file,
        headers: {
          'Content-Type': file.type,
        },
      });

      if (!uploadResponse.ok) {
        throw new Error('Failed to upload file');
      }

      return urlResponse.objectUrl;
    } catch (error) {
      console.error('OSS upload error:', error);
      throw new Error('上传文件到存储失败');
    }
  };

  const onSubmit = async (data: UploadFormData) => {
    if (!selectedFile || !authToken) {
      toast.error('请选择文件');
      return;
    }

    try {
      setUploadStatus("uploading");
      setUploadProgress(25);

      // Upload file to OSS
      const fileUrl = await uploadFileToOSS(selectedFile);
      
      setUploadStatus("processing");
      setUploadProgress(50);

      // Create assignment record
      const assignmentResult = await uploadMutation.mutateAsync({
        authToken,
        childId,
        title: data.title,
        description: data.description,
        imageUrl: fileUrl,
      });

      setUploadStatus("analyzing");
      setUploadProgress(75);

      // Trigger AI analysis
      await analyzeMutation.mutateAsync({
        authToken,
        assignmentId: assignmentResult.assignment.id,
        imageUrl: fileUrl,
      });

      setUploadStatus("complete");
      setUploadProgress(100);

      toast.success('作业上传并分析成功！');
      
      // Reset form
      reset();
      setSelectedFile(null);
      setPreviewUrl(null);
      
      // Call success callback
      onSuccess?.();
      
    } catch (error: any) {
      console.error('Upload error:', error);
      setUploadStatus("error");
      toast.error(error.message || '上传作业失败');
    }
  };

  const getStatusMessage = () => {
    switch (uploadStatus) {
      case "uploading": return "正在上传作业...";
      case "processing": return "正在创建作业记录...";
      case "analyzing": return "正在进行AI分析...";
      case "complete": return "上传完成！";
      case "error": return "上传失败";
      default: return "";
    }
  };

  const getStatusIcon = () => {
    switch (uploadStatus) {
      case "uploading":
      case "processing":
      case "analyzing":
        return <Loader2 className="w-5 h-5 animate-spin" />;
      case "complete":
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case "error":
        return <AlertCircle className="w-5 h-5 text-red-600" />;
      default:
        return null;
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Camera className="w-6 h-6 text-pink-600 mr-3" />
            <h3 className="text-lg font-semibold text-gray-900">上传作业</h3>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="p-1 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
        <p className="text-sm text-gray-600 mt-1">
          上传您孩子的作业以获得AI分析和反馈
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6">
        {/* File Upload */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            作业图片
          </label>
          
          {!selectedFile ? (
            <div 
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-pink-400 hover:bg-pink-50 transition-all cursor-pointer group"
            >
              <Camera className="w-12 h-12 text-gray-400 group-hover:text-pink-600 mx-auto mb-4" />
              <h4 className="text-lg font-medium text-gray-900 group-hover:text-pink-700 mb-2">
                选择作业照片
              </h4>
              <p className="text-gray-500">
                点击选择图片文件（JPG、PNG等）
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="relative">
                <img
                  src={previewUrl!}
                  alt="Assignment preview"
                  className="w-full h-48 object-cover rounded-lg border border-gray-200"
                />
                <button
                  type="button"
                  onClick={() => {
                    setSelectedFile(null);
                    setPreviewUrl(null);
                  }}
                  className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="flex items-center text-sm text-gray-600">
                <FileText className="w-4 h-4 mr-2" />
                {selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
              </div>
            </div>
          )}
          
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
          />
        </div>

        {/* Assignment Details */}
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
            作业标题
          </label>
          <input
            {...register("title")}
            type="text"
            id="title"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-colors"
            placeholder="例如：数学作业第5章"
          />
          {errors.title && (
            <p className="text-red-600 text-sm mt-1">{errors.title.message}</p>
          )}
        </div>

        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
            描述（可选）
          </label>
          <textarea
            {...register("description")}
            id="description"
            rows={3}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-colors"
            placeholder="添加关于此作业的其他说明..."
          />
        </div>

        {/* Upload Progress */}
        {uploadStatus !== "idle" && (
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center">
                {getStatusIcon()}
                <span className="ml-2 text-sm font-medium text-gray-700">
                  {getStatusMessage()}
                </span>
              </div>
              <span className="text-sm text-gray-500">{uploadProgress}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-pink-600 h-2 rounded-full transition-all duration-500"
                style={{ width: `${uploadProgress}%` }}
              ></div>
            </div>
          </div>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          disabled={!selectedFile || uploadStatus === "uploading" || uploadStatus === "processing" || uploadStatus === "analyzing"}
          className="w-full bg-gradient-to-r from-pink-500 to-rose-600 text-white py-3 px-4 rounded-lg font-medium hover:from-pink-600 hover:to-rose-700 focus:ring-2 focus:ring-pink-500 focus:ring-offset-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {uploadStatus === "idle" ? (
            <>
              <Upload className="w-4 h-4 inline mr-2" />
              上传并分析
            </>
          ) : uploadStatus === "complete" ? (
            "再上传一个"
          ) : (
            "处理中..."
          )}
        </button>
      </form>
    </div>
  );
}
