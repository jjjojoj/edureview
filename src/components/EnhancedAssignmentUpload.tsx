import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { useState, useRef, useCallback, useEffect } from "react";
import { useTRPC } from "~/trpc/react";
import { useAuthStore } from "~/stores/authStore";
import { useToast } from "~/components/Toast";
import { getErrorMessage } from "~/utils/trpcError";
import {
  Camera,
  X,
  Upload,
  Loader2,
  CheckCircle,
  Pause,
  Play,
} from "lucide-react";
import { uploadSchema } from "./parent/types";
import type { UploadFormData, AssignmentFile, UploadQueueStatus } from "./parent/types";
import { compressImage } from "./parent/compressImage";
import { ParentFileUploadZone } from "./parent/ParentFileUploadZone";
import { ParentFileList } from "./parent/ParentFileList";
import { ParentCameraCapture } from "./parent/ParentCameraCapture";

interface EnhancedAssignmentUploadProps {
  childId: number;
  onSuccess?: (uploadedCount: number) => void;
  onClose?: () => void;
  maxFiles?: number;
  allowMultiple?: boolean;
}

export function EnhancedAssignmentUpload({
  childId,
  onSuccess,
  onClose,
  maxFiles = 5,
  allowMultiple = true,
}: EnhancedAssignmentUploadProps) {
  const [files, setFiles] = useState<AssignmentFile[]>([]);
  const [queueStatus, setQueueStatus] = useState<UploadQueueStatus>("idle");
  const [dragActive, setDragActive] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [completedCount, setCompletedCount] = useState(0);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const trpc = useTRPC();
  const { authToken } = useAuthStore();
  const toast = useToast();

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

  const validateFile = (file: File): string | null => {
    if (!file.type.startsWith('image/')) {
      return '请选择图片文件（JPG、PNG、GIF、WebP）';
    }

    if (file.size > 20 * 1024 * 1024) {
      return '文件大小必须小于20MB';
    }

    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      return '不支持的文件格式。请选择 JPG、PNG、GIF 或 WebP 文件';
    }

    return null;
  };

  const addFiles = useCallback(async (newFiles: FileList | File[]) => {
    const fileArray = Array.from(newFiles);
    const currentFileCount = files.length;

    if (currentFileCount + fileArray.length > maxFiles) {
      toast.error(`最多只能上传 ${maxFiles} 个文件`);
      return;
    }

    const validFiles: AssignmentFile[] = [];

    for (const file of fileArray) {
      const error = validateFile(file);
      if (error) {
        toast.error(`${file.name}: ${error}`);
        continue;
      }

      const isDuplicate = files.some(f =>
        f.file.name === file.name &&
        f.file.size === file.size &&
        f.file.lastModified === file.lastModified
      );

      if (isDuplicate) {
        toast.error(`${file.name} 已存在`);
        continue;
      }

      const previewUrl = URL.createObjectURL(file);

      validFiles.push({
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        file,
        previewUrl,
        status: "pending",
        progress: 0,
        retryCount: 0,
      });
    }

    if (validFiles.length > 0) {
      setFiles(prev => [...prev, ...validFiles]);
      toast.success(`已添加 ${validFiles.length} 个文件`);
    }
  }, [files, maxFiles, toast]);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      addFiles(e.dataTransfer.files);
    }
  }, [addFiles]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      addFiles(e.target.files);
      e.target.value = '';
    }
  }, [addFiles]);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setShowCamera(true);
      }
    } catch {
      toast.error('无法访问摄像头');
    }
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');

      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      context?.drawImage(video, 0, 0);

      canvas.toBlob((blob) => {
        if (blob) {
          const file = new File([blob], `camera-capture-${Date.now()}.jpg`, {
            type: 'image/jpeg',
            lastModified: Date.now(),
          });
          addFiles([file]);
          stopCamera();
        }
      }, 'image/jpeg', 0.8);
    }
  };

  const stopCamera = () => {
    if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    setShowCamera(false);
  };

  const uploadFileToOSS = async (file: File): Promise<string> => {
    try {
      const urlResponse = await presignedUrlMutation.mutateAsync({
        authToken: authToken!,
        fileName: `parent-${Date.now()}-${file.name}`,
        fileType: file.type,
        folderName: "assignment-uploads",
      });

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
    } catch {
      throw new Error('上传文件到存储失败');
    }
  };

  const processFile = async (fileId: string, formData: UploadFormData) => {
    const fileIndex = files.findIndex(f => f.id === fileId);
    if (fileIndex === -1) return;

    const updateFileStatus = (status: AssignmentFile['status'], progress: number, error?: string) => {
      setFiles(prev => prev.map(f =>
        f.id === fileId ? { ...f, status, progress, error } : f
      ));
    };

    try {
      const file = files[fileIndex];
      if (!file) return;

      updateFileStatus("compressing", 10);
      const compressedFile = await compressImage(file.file);

      setFiles(prev => prev.map(f =>
        f.id === fileId ? { ...f, compressedFile } : f
      ));

      updateFileStatus("uploading", 25);
      const fileUrl = await uploadFileToOSS(compressedFile);

      updateFileStatus("processing", 50);
      const assignmentResult = await uploadMutation.mutateAsync({
        authToken: authToken!,
        childId,
        title: `${formData.title} - ${file.file.name}`,
        description: formData.description,
        imageUrl: fileUrl,
      });

      updateFileStatus("analyzing", 75);
      await analyzeMutation.mutateAsync({
        authToken: authToken!,
        assignmentId: assignmentResult.assignment.id,
        imageUrl: fileUrl,
      });

      updateFileStatus("complete", 100);
      setCompletedCount(prev => prev + 1);

    } catch (error: unknown) {
      const file = files[fileIndex];
      const errorMsg = getErrorMessage(error);

      if (file && file.retryCount < 3) {
        setFiles(prev => prev.map(f =>
          f.id === fileId ? {
            ...f,
            status: "error",
            error: errorMsg,
            retryCount: f.retryCount + 1
          } : f
        ));
      } else {
        updateFileStatus("error", 0, errorMsg);
      }
    }
  };

  const startQueue = async (formData: UploadFormData) => {
    if (!authToken) {
      toast.error('请先登录');
      return;
    }

    setQueueStatus("running");
    setCompletedCount(0);

    const pendingFiles = files.filter(f => f.status === "pending" || f.status === "error");

    for (const file of pendingFiles) {
      if (queueStatus === "paused") break;
      await processFile(file.id, formData);
    }

    setQueueStatus("completed");

    const successCount = files.filter(f => f.status === "complete").length;
    if (successCount > 0) {
      toast.success(`成功上传并分析了 ${successCount} 个作业！`);
      onSuccess?.(successCount);
    }
  };

  const pauseQueue = () => {
    setQueueStatus("paused");
  };

  const resumeQueue = (formData: UploadFormData) => {
    setQueueStatus("running");
    startQueue(formData);
  };

  const retryFile = (fileId: string, formData: UploadFormData) => {
    setFiles(prev => prev.map(f =>
      f.id === fileId ? { ...f, status: "pending", error: undefined } : f
    ));
    processFile(fileId, formData);
  };

  const removeFile = (fileId: string) => {
    setFiles(prev => {
      const file = prev.find(f => f.id === fileId);
      if (file) {
        URL.revokeObjectURL(file.previewUrl);
      }
      return prev.filter(f => f.id !== fileId);
    });
  };

  const clearCompleted = () => {
    setFiles(prev => {
      const completedFiles = prev.filter(f => f.status === "complete");
      completedFiles.forEach(file => URL.revokeObjectURL(file.previewUrl));
      return prev.filter(f => f.status !== "complete");
    });
  };

  const onSubmit = (data: UploadFormData) => {
    if (files.length === 0) {
      toast.error('请至少选择一个文件');
      return;
    }
    startQueue(data);
  };

  // Cleanup URLs on unmount
  useEffect(() => {
    return () => {
      files.forEach(file => URL.revokeObjectURL(file.previewUrl));
    };
  }, []);

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden max-w-4xl mx-auto">
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Camera className="w-6 h-6 text-pink-600 mr-3" />
            <div>
              <h3 className="text-lg font-semibold text-gray-900">增强版作业上传</h3>
              <p className="text-sm text-gray-600">
                支持拖拽、多文件上传、自动压缩和批量分析
              </p>
            </div>
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
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6">
        {/* Assignment Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
            <input
              {...register("description")}
              type="text"
              id="description"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-colors"
              placeholder="添加关于此作业的其他说明..."
            />
          </div>
        </div>

        {/* File Upload Area */}
        <ParentFileUploadZone
          dragActive={dragActive}
          onDrag={handleDrag}
          onDrop={handleDrop}
          onFileSelect={handleFileSelect}
          onStartCamera={startCamera}
          maxFiles={maxFiles}
          allowMultiple={allowMultiple}
        />

        {/* File List & Queue Status */}
        <ParentFileList
          files={files}
          maxFiles={maxFiles}
          queueStatus={queueStatus}
          completedCount={completedCount}
          onRemoveFile={removeFile}
          onClearCompleted={clearCompleted}
          onRetryFile={(fileId) => retryFile(fileId, { title: "重试", description: "" })}
        />

        {/* Submit Button */}
        <div className="flex space-x-3">
          <button
            type="submit"
            disabled={files.length === 0 || queueStatus === "running"}
            className="flex-1 bg-gradient-to-r from-pink-500 to-rose-600 text-white py-3 px-4 rounded-lg font-medium hover:from-pink-600 hover:to-rose-700 focus:ring-2 focus:ring-pink-500 focus:ring-offset-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {queueStatus === "running" ? (
              <>
                <Loader2 className="w-4 h-4 inline mr-2 animate-spin" />
                处理中... ({completedCount}/{files.length})
              </>
            ) : queueStatus === "completed" ? (
              <>
                <CheckCircle className="w-4 h-4 inline mr-2" />
                全部完成
              </>
            ) : (
              <>
                <Upload className="w-4 h-4 inline mr-2" />
                开始上传并分析 ({files.length} 个文件)
              </>
            )}
          </button>

          {queueStatus === "running" && (
            <button
              type="button"
              onClick={pauseQueue}
              className="px-4 py-3 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors"
            >
              <Pause className="w-4 h-4" />
            </button>
          )}

          {queueStatus === "paused" && (
            <button
              type="button"
              onClick={() => resumeQueue({ title: "恢复", description: "" })}
              className="px-4 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
            >
              <Play className="w-4 h-4" />
            </button>
          )}
        </div>
      </form>

      {/* Camera Modal */}
      <ParentCameraCapture
        isOpen={showCamera}
        videoRef={videoRef}
        canvasRef={canvasRef}
        onCapture={capturePhoto}
        onClose={stopCamera}
      />
    </div>
  );
}
