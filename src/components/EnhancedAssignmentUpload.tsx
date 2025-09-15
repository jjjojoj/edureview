import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { useState, useRef, useCallback, useEffect } from "react";
import { useTRPC } from "~/trpc/react";
import { useAuthStore } from "~/stores/authStore";
import { 
  Upload, 
  Camera, 
  FileText, 
  Loader2, 
  CheckCircle, 
  AlertCircle, 
  X, 
  Plus,
  Pause,
  Play,
  RotateCcw,
  Image,
  Trash2,
  Eye
} from "lucide-react";
import toast from "react-hot-toast";

const uploadSchema = z.object({
  title: z.string().min(1, "作业标题不能为空"),
  description: z.string().optional(),
});

type UploadFormData = z.infer<typeof uploadSchema>;

interface AssignmentFile {
  id: string;
  file: File;
  compressedFile?: File;
  previewUrl: string;
  status: "pending" | "compressing" | "uploading" | "processing" | "analyzing" | "complete" | "error" | "paused";
  progress: number;
  error?: string;
  assignmentId?: number;
  retryCount: number;
}

interface EnhancedAssignmentUploadProps {
  childId: number;
  onSuccess?: (uploadedCount: number) => void;
  onClose?: () => void;
  maxFiles?: number;
  allowMultiple?: boolean;
}

type UploadQueueStatus = "idle" | "running" | "paused" | "completed";

const compressImage = async (file: File, maxWidth = 1920, maxHeight = 1080, quality = 0.8): Promise<File> => {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    img.onload = () => {
      // Calculate new dimensions
      let { width, height } = img;
      
      if (width > height) {
        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }
      } else {
        if (height > maxHeight) {
          width = (width * maxHeight) / height;
          height = maxHeight;
        }
      }
      
      canvas.width = width;
      canvas.height = height;
      
      // Draw and compress
      ctx?.drawImage(img, 0, 0, width, height);
      
      canvas.toBlob((blob) => {
        if (blob) {
          const compressedFile = new File([blob], file.name, {
            type: file.type,
            lastModified: Date.now(),
          });
          resolve(compressedFile);
        } else {
          resolve(file); // Fallback to original if compression fails
        }
      }, file.type, quality);
    };
    
    img.src = URL.createObjectURL(file);
  });
};

export function EnhancedAssignmentUpload({ 
  childId, 
  onSuccess, 
  onClose, 
  maxFiles = 5,
  allowMultiple = true 
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
    
    if (file.size > 20 * 1024 * 1024) { // 20MB limit before compression
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
      
      // Check for duplicates
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
  }, [files, maxFiles]);

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
      e.target.value = ''; // Reset input
    }
  }, [addFiles]);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } // Prefer back camera
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setShowCamera(true);
      }
    } catch (error) {
      console.error('Camera access error:', error);
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
    } catch (error) {
      console.error('OSS upload error:', error);
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
      
      // Compress image
      updateFileStatus("compressing", 10);
      const compressedFile = await compressImage(file.file);
      
      setFiles(prev => prev.map(f => 
        f.id === fileId ? { ...f, compressedFile } : f
      ));

      // Upload to OSS
      updateFileStatus("uploading", 25);
      const fileUrl = await uploadFileToOSS(compressedFile);

      // Create assignment record
      updateFileStatus("processing", 50);
      const assignmentResult = await uploadMutation.mutateAsync({
        authToken: authToken!,
        childId,
        title: `${formData.title} - ${file.file.name}`,
        description: formData.description,
        imageUrl: fileUrl,
      });

      // Trigger AI analysis
      updateFileStatus("analyzing", 75);
      await analyzeMutation.mutateAsync({
        authToken: authToken!,
        assignmentId: assignmentResult.assignment.id,
        imageUrl: fileUrl,
      });

      updateFileStatus("complete", 100);
      setCompletedCount(prev => prev + 1);
      
    } catch (error: any) {
      console.error(`Processing error for ${fileId}:`, error);
      const file = files[fileIndex];
      
      if (file.retryCount < 3) {
        setFiles(prev => prev.map(f => 
          f.id === fileId ? { 
            ...f, 
            status: "error", 
            error: error.message || '上传失败',
            retryCount: f.retryCount + 1
          } : f
        ));
      } else {
        updateFileStatus("error", 0, error.message || '上传失败');
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
    
    // Process files sequentially to avoid overwhelming the server
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
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
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
                        startCamera();
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
            onChange={handleFileSelect}
            className="hidden"
          />
        </div>

        {/* File List */}
        {files.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-medium text-gray-900">
                已选择的文件 ({files.length}/{maxFiles})
              </h4>
              
              {files.some(f => f.status === "complete") && (
                <button
                  type="button"
                  onClick={clearCompleted}
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
                      onClick={() => removeFile(file.id)}
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
                          onClick={() => retryFile(file.id, { title: "重试", description: "" })}
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
      {showCamera && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">拍照上传</h3>
              <button
                onClick={stopCamera}
                className="p-1 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="space-y-4">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                className="w-full rounded-lg"
              />
              
              <div className="flex space-x-3">
                <button
                  onClick={capturePhoto}
                  className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Camera className="w-4 h-4 inline mr-2" />
                  拍照
                </button>
                <button
                  onClick={stopCamera}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
                >
                  取消
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}
