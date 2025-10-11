import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery } from "@tanstack/react-query";
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
  ImageIcon,
  Trash2,
  Eye,
  Brain,
  Settings,
  Users,
  Zap
} from "lucide-react";
import toast from "react-hot-toast";

const uploadSchema = z.object({
  title: z.string().min(1, "Assignment title is required"),
  description: z.string().optional(),
  selectedModel: z.string().min(1, "Please select an AI model"),
  confidenceThreshold: z.number().min(0).max(1).default(0.7),
  autoAssignStudents: z.boolean().default(true),
});

type UploadFormData = z.infer<typeof uploadSchema>;

interface RecognitionResult {
  studentName: string;
  className: string;
  confidence: number;
  reasoning: string;
}

interface AssignmentFile {
  id: string;
  file: File;
  compressedFile?: File;
  previewUrl: string;
  status: "pending" | "compressing" | "uploading" | "recognizing" | "processing" | "complete" | "error" | "paused";
  progress: number;
  error?: string;
  assignmentId?: number;
  retryCount: number;
  recognition?: RecognitionResult;
  selectedStudentId?: number;
  uploadedImageUrl?: string;
}

interface EnhancedTeacherAssignmentUploadProps {
  isOpen: boolean;
  classId: number;
  students?: Array<{ id: number; name: string; }>;
  onSuccess?: (uploadedCount: number) => void;
  onClose?: () => void;
  maxFiles?: number;
  allowMultiple?: boolean;
  uploadType?: "assignment" | "exam";
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

export function EnhancedTeacherAssignmentUpload({
  isOpen,
  classId,
  students = [],
  onSuccess,
  onClose,
  maxFiles = 10,
  allowMultiple = true,
  uploadType = "assignment"
}: EnhancedTeacherAssignmentUploadProps) {
  const [files, setFiles] = useState<AssignmentFile[]>([]);
  const [queueStatus, setQueueStatus] = useState<UploadQueueStatus>("idle");
  const [dragActive, setDragActive] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [completedCount, setCompletedCount] = useState(0);
  const [showAdvancedSettings, setShowAdvancedSettings] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  const trpc = useTRPC();
  const { authToken } = useAuthStore();

  // Get available AI models
  const modelsQuery = useQuery({
    ...trpc.getAvailableModels.queryOptions(),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
    setValue,
  } = useForm<UploadFormData>({
    resolver: zodResolver(uploadSchema),
    defaultValues: {
      selectedModel: 'siliconcloud/qwen2.5-vl-7b',
      confidenceThreshold: 0.7,
      autoAssignStudents: true,
    },
  });

  const confidenceThreshold = watch('confidenceThreshold');
  const autoAssignStudents = watch('autoAssignStudents');

  const presignedUrlMutation = useMutation(trpc.generatePresignedUploadUrl.mutationOptions());
  const recognizeStudentMutation = useMutation(trpc.recognizeStudentInfo.mutationOptions());
  const uploadTeacherAssignmentMutation = useMutation(trpc.uploadTeacherAssignment.mutationOptions());
  const uploadTeacherExamMutation = useMutation(trpc.uploadTeacherExam.mutationOptions());

  const validateFile = (file: File): string | null => {
    if (!file.type.startsWith('image/')) {
      return 'Please select an image file (JPG, PNG, GIF, WebP)';
    }
    
    if (file.size > 20 * 1024 * 1024) { // 20MB limit before compression
      return 'File size must be less than 20MB';
    }
    
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      return 'Unsupported file format. Please choose JPG, PNG, GIF, or WebP files';
    }
    
    return null;
  };

  const addFiles = useCallback(async (newFiles: FileList | File[]) => {
    const fileArray = Array.from(newFiles);
    const currentFileCount = files.length;
    
    if (currentFileCount + fileArray.length > maxFiles) {
      toast.error(`Maximum ${maxFiles} files allowed`);
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
        toast.error(`${file.name} already exists`);
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
      toast.success(`Added ${validFiles.length} files`);
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
      toast.error('Unable to access camera');
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
      const folderName = uploadType === "exam" ? "exam-uploads" : "assignment-uploads";
      
      const urlResponse = await presignedUrlMutation.mutateAsync({
        authToken: authToken!,
        fileName: `teacher-${Date.now()}-${file.name}`,
        fileType: file.type,
        folderName,
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
      throw new Error('Failed to upload file to storage');
    }
  };

  const processFile = async (fileId: string, formData: UploadFormData) => {
    const fileIndex = files.findIndex(f => f.id === fileId);
    if (fileIndex === -1) return;

    const updateFileStatus = (status: AssignmentFile['status'], progress: number, error?: string, updates?: Partial<AssignmentFile>) => {
      setFiles(prev => prev.map(f => 
        f.id === fileId ? { ...f, status, progress, error, ...updates } : f
      ));
    };

    try {
      const file = files[fileIndex];
      
      // Compress image
      updateFileStatus("compressing", 10);
      const compressedFile = await compressImage(file.file);
      
      updateFileStatus("compressing", 20, undefined, { compressedFile });

      // Upload to OSS
      updateFileStatus("uploading", 30);
      const fileUrl = await uploadFileToOSS(compressedFile);
      
      updateFileStatus("uploading", 50, undefined, { uploadedImageUrl: fileUrl });

      // AI Recognition
      updateFileStatus("recognizing", 60);
      const recognition = await recognizeStudentMutation.mutateAsync({
        authToken: authToken!,
        imageUrl: fileUrl,
        modelKey: formData.selectedModel,
      });

      if (recognition.success) {
        updateFileStatus("recognizing", 70, undefined, { recognition: recognition.recognition });

        // Auto-assign student if confidence is high enough
        let selectedStudentId: number | undefined;
        
        if (autoAssignStudents && recognition.recognition.confidence >= confidenceThreshold) {
          const matchedStudent = students.find(s => 
            s.name.toLowerCase().includes(recognition.recognition.studentName.toLowerCase()) ||
            recognition.recognition.studentName.toLowerCase().includes(s.name.toLowerCase())
          );
          
          if (matchedStudent) {
            selectedStudentId = matchedStudent.id;
            updateFileStatus("recognizing", 80, undefined, { selectedStudentId });
            toast.success(`Auto-assigned to ${matchedStudent.name}`);
          }
        }

        // If we have a student assignment or confidence is low, create assignment/exam
        if (selectedStudentId || !autoAssignStudents) {
          updateFileStatus("processing", 85);
          
          const finalStudentId = selectedStudentId || students[0]?.id; // Fallback to first student
          
          if (finalStudentId) {
            const uploadMutation = uploadType === "exam" ? uploadTeacherExamMutation : uploadTeacherAssignmentMutation;
            
            // Generate default title if not provided
            const defaultTitle = uploadType === "exam" 
              ? `考试 - ${new Date().toLocaleDateString('zh-CN', { 
                  year: 'numeric', 
                  month: '2-digit', 
                  day: '2-digit' 
                })}`
              : `作业 - ${new Date().toLocaleDateString('zh-CN', { 
                  year: 'numeric', 
                  month: '2-digit', 
                  day: '2-digit' 
                })}`;

            const finalTitle = formData.title && formData.title.trim() ? formData.title : defaultTitle;
            
            await uploadMutation.mutateAsync({
              authToken: authToken!,
              studentId: finalStudentId,
              title: `${finalTitle} - ${file.file.name}`,
              description: formData.description,
              imageUrl: fileUrl,
            });

            updateFileStatus("complete", 100);
            setCompletedCount(prev => prev + 1);
          } else {
            throw new Error('No student available for assignment');
          }
        } else {
          // Low confidence, needs manual assignment
          updateFileStatus("complete", 100, undefined, { 
            recognition: recognition.recognition,
            uploadedImageUrl: fileUrl 
          });
          setCompletedCount(prev => prev + 1);
          toast(`${file.file.name} uploaded but needs manual student assignment (confidence: ${Math.round(recognition.recognition.confidence * 100)}%)`, {
            icon: '⚠️',
            style: {
              background: '#f59e0b',
              color: 'white',
            },
          });
        }
      } else {
        throw new Error('AI recognition failed');
      }
      
    } catch (error: any) {
      console.error(`Processing error for ${fileId}:`, error);
      const file = files[fileIndex];
      
      if (file.retryCount < 3) {
        setFiles(prev => prev.map(f => 
          f.id === fileId ? { 
            ...f, 
            status: "error", 
            error: error.message || 'Upload failed',
            retryCount: f.retryCount + 1
          } : f
        ));
      } else {
        updateFileStatus("error", 0, error.message || 'Upload failed');
      }
    }
  };

  const startQueue = async (formData: UploadFormData) => {
    if (!authToken) {
      toast.error('Please login first');
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
      toast.success(`Successfully processed ${successCount} ${uploadType}s!`);
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

  const assignStudentToFile = (fileId: string, studentId: number) => {
    setFiles(prev => prev.map(f => 
      f.id === fileId ? { ...f, selectedStudentId: studentId } : f
    ));
  };

  const onSubmit = (data: UploadFormData) => {
    if (files.length === 0) {
      toast.error('Please select at least one file');
      return;
    }
    startQueue(data);
  };

  const getStatusColor = (status: AssignmentFile['status']) => {
    switch (status) {
      case "complete": return "text-green-600";
      case "error": return "text-red-600";
      case "uploading":
      case "processing": return "text-blue-600";
      case "recognizing": return "text-purple-600";
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
      case "processing": return <Loader2 className="w-4 h-4 animate-spin" />;
      case "recognizing": return <Brain className="w-4 h-4 animate-pulse" />;
      case "compressing": return <ImageIcon className="w-4 h-4 animate-pulse" />;
      case "paused": return <Pause className="w-4 h-4" />;
      default: return <FileText className="w-4 h-4" />;
    }
  };

  const getStatusMessage = (status: AssignmentFile['status']) => {
    switch (status) {
      case "compressing": return "Compressing image...";
      case "uploading": return "Uploading to storage...";
      case "recognizing": return "Recognizing student info...";
      case "processing": return "Creating assignment...";
      case "complete": return "Complete";
      case "error": return "Failed";
      case "paused": return "Paused";
      default: return "Pending";
    }
  };

  // Cleanup URLs on unmount
  useEffect(() => {
    return () => {
      files.forEach(file => URL.revokeObjectURL(file.previewUrl));
    };
  }, []);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden max-w-6xl mx-auto w-full max-h-[90vh] overflow-y-auto">
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Brain className="w-6 h-6 text-blue-600 mr-3" />
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Enhanced {uploadType === "exam" ? "Exam" : "Assignment"} Upload</h3>
              <p className="text-sm text-gray-600">
                AI驱动的批量上传：自动识别学生信息、智能分配作业、支持拖拽上传
              </p>
              <div className="mt-2 flex flex-wrap gap-2 text-xs">
                <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded-lg">✨ AI识别学生姓名</span>
                <span className="bg-green-100 text-green-700 px-2 py-1 rounded-lg">🚀 批量处理</span>
                <span className="bg-purple-100 text-purple-700 px-2 py-1 rounded-lg">📱 支持拍照</span>
                <span className="bg-orange-100 text-orange-700 px-2 py-1 rounded-lg">🗜️ 自动压缩</span>
              </div>
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
        {/* Assignment Details and Settings */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
              {uploadType === "exam" ? "Exam" : "Assignment"} Title
            </label>
            <input
              {...register("title")}
              type="text"
              id="title"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
              placeholder={`e.g., ${uploadType === "exam" ? "Math Final Exam" : "Math Homework Chapter 5"}`}
            />
            {errors.title && (
              <p className="text-red-600 text-sm mt-1">{errors.title.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="selectedModel" className="block text-sm font-medium text-gray-700 mb-2">
              AI Model
            </label>
            <select
              {...register("selectedModel")}
              id="selectedModel"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
            >
              {modelsQuery.data?.models.map((model) => (
                <option key={model.key} value={model.key}>
                  {model.name}
                  {model.isDefault ? " (Default)" : ""}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
              Description (Optional)
            </label>
            <input
              {...register("description")}
              type="text"
              id="description"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
              placeholder="Additional notes..."
            />
          </div>
        </div>

        {/* Advanced Settings */}
        <div className="border border-gray-200 rounded-lg">
          <button
            type="button"
            onClick={() => setShowAdvancedSettings(!showAdvancedSettings)}
            className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center">
              <Settings className="w-5 h-5 text-gray-500 mr-2" />
              <span className="font-medium text-gray-900">Advanced Settings</span>
            </div>
            <div className={`transform transition-transform ${showAdvancedSettings ? 'rotate-180' : ''}`}>
              <X className="w-5 h-5 text-gray-400" />
            </div>
          </button>
          
          {showAdvancedSettings && (
            <div className="border-t border-gray-200 p-4 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="confidenceThreshold" className="block text-sm font-medium text-gray-700 mb-2">
                    Confidence Threshold: {Math.round(confidenceThreshold * 100)}%
                  </label>
                  <input
                    {...register("confidenceThreshold", { valueAsNumber: true })}
                    type="range"
                    id="confidenceThreshold"
                    min="0"
                    max="1"
                    step="0.1"
                    className="w-full"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Minimum confidence required for auto-assignment
                  </p>
                </div>

                <div className="flex items-center space-x-3">
                  <input
                    {...register("autoAssignStudents")}
                    type="checkbox"
                    id="autoAssignStudents"
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="autoAssignStudents" className="text-sm font-medium text-gray-700">
                    Auto-assign students based on AI recognition
                  </label>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* File Upload Area */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            {uploadType === "exam" ? "Exam" : "Assignment"} Images {allowMultiple && `(up to ${maxFiles} files)`}
          </label>
          
          <div 
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-all cursor-pointer ${
              dragActive 
                ? 'border-blue-400 bg-blue-50' 
                : 'border-gray-300 hover:border-blue-400 hover:bg-blue-50'
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
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
                        startCamera();
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
            onChange={handleFileSelect}
            className="hidden"
          />
        </div>

        {/* Feature Introduction when no files */}
        {files.length === 0 && (
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-6">
            <div className="text-center mb-4">
              <Brain className="w-12 h-12 text-blue-600 mx-auto mb-3" />
              <h4 className="text-lg font-semibold text-gray-900 mb-2">智能作业上传系统</h4>
              <p className="text-gray-600 text-sm">利用AI技术简化作业管理流程</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div className="bg-white rounded-lg p-4 border border-blue-100">
                <div className="flex items-center mb-2">
                  <Zap className="w-5 h-5 text-yellow-600 mr-2" />
                  <span className="font-medium text-gray-900">智能识别</span>
                </div>
                <p className="text-gray-600">AI自动识别作业图片中的学生姓名，并匹配到对应学生档案</p>
              </div>

              <div className="bg-white rounded-lg p-4 border border-blue-100">
                <div className="flex items-center mb-2">
                  <Users className="w-5 h-5 text-green-600 mr-2" />
                  <span className="font-medium text-gray-900">自动分配</span>
                </div>
                <p className="text-gray-600">根据置信度自动将作业分配给正确的学生，节省手动操作时间</p>
              </div>

              <div className="bg-white rounded-lg p-4 border border-blue-100">
                <div className="flex items-center mb-2">
                  <ImageIcon className="w-5 h-5 text-purple-600 mr-2" />
                  <span className="font-medium text-gray-900">智能压缩</span>
                </div>
                <p className="text-gray-600">自动压缩图片文件，确保上传速度快且存储空间优化</p>
              </div>

              <div className="bg-white rounded-lg p-4 border border-blue-100">
                <div className="flex items-center mb-2">
                  <CheckCircle className="w-5 h-5 text-blue-600 mr-2" />
                  <span className="font-medium text-gray-900">批量处理</span>
                </div>
                <p className="text-gray-600">支持一次上传多个作业图片，系统自动排队处理</p>
              </div>
            </div>
          </div>
        )}

        {/* File List */}
        {files.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-medium text-gray-900 flex items-center">
                <Users className="w-5 h-5 mr-2" />
                Selected Files ({files.length}/{maxFiles})
              </h4>
              
              <div className="flex space-x-2">
                {files.some(f => f.status === "complete") && (
                  <button
                    type="button"
                    onClick={clearCompleted}
                    className="text-sm text-gray-600 hover:text-gray-800 flex items-center px-3 py-1 rounded-lg hover:bg-gray-100"
                  >
                    <Trash2 className="w-4 h-4 mr-1" />
                    Clear Completed
                  </button>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4 max-h-96 overflow-y-auto">
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
                      
                      <p className="text-xs text-gray-500 mt-1">
                        {getStatusMessage(file.status)}
                      </p>
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
                        className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                        style={{ width: `${file.progress}%` }}
                      />
                    </div>
                  )}

                  {/* AI Recognition Results */}
                  {file.recognition && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-blue-900">AI Recognition</span>
                        <span className="text-xs text-blue-600">
                          {Math.round(file.recognition.confidence * 100)}%
                        </span>
                      </div>
                      
                      <div className="text-xs text-gray-600">
                        <p><strong>Student:</strong> {file.recognition.studentName || 'Not detected'}</p>
                        <p><strong>Class:</strong> {file.recognition.className || 'Not detected'}</p>
                      </div>

                      {!file.selectedStudentId && file.recognition.confidence < confidenceThreshold && (
                        <select
                          onChange={(e) => assignStudentToFile(file.id, parseInt(e.target.value))}
                          className="w-full text-xs px-2 py-1 border border-gray-300 rounded"
                          defaultValue=""
                        >
                          <option value="">Assign to student...</option>
                          {students.map((student) => (
                            <option key={student.id} value={student.id}>
                              {student.name}
                            </option>
                          ))}
                        </select>
                      )}
                    </div>
                  )}

                  {/* Error Message & Retry */}
                  {file.status === "error" && (
                    <div className="space-y-2">
                      <p className="text-xs text-red-600">{file.error}</p>
                      {file.retryCount < 3 && (
                        <button
                          type="button"
                          onClick={() => retryFile(file.id, { title: "Retry", description: "", selectedModel: "siliconcloud/qwen2.5-vl-7b", confidenceThreshold: 0.7, autoAssignStudents: true })}
                          className="text-xs text-blue-600 hover:text-blue-800 flex items-center"
                        >
                          <RotateCcw className="w-3 h-3 mr-1" />
                          Retry ({file.retryCount}/3)
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
                {queueStatus === "running" && <Zap className="w-5 h-5 animate-pulse text-blue-600 mr-2" />}
                {queueStatus === "paused" && <Pause className="w-5 h-5 text-yellow-600 mr-2" />}
                {queueStatus === "completed" && <CheckCircle className="w-5 h-5 text-green-600 mr-2" />}
                
                <span className="text-sm font-medium text-gray-700">
                  {queueStatus === "running" && "Processing upload queue with AI recognition..."}
                  {queueStatus === "paused" && "Upload queue paused"}
                  {queueStatus === "completed" && "Upload queue completed"}
                </span>
              </div>
              
              <span className="text-sm text-gray-500">
                {completedCount}/{files.length} completed
              </span>
            </div>
            
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                style={{ width: `${files.length > 0 ? (completedCount / files.length) * 100 : 0}%` }}
              />
            </div>
          </div>
        )}

        {/* Submit Button */}
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
                    <li>预计处理时间：约 {files.length * 15} 秒</li>
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
              onClick={pauseQueue}
              className="px-4 py-3 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors"
            >
              <Pause className="w-4 h-4" />
            </button>
          )}

          {queueStatus === "paused" && (
            <button
              type="button"
              onClick={() => resumeQueue({ title: "Resume", description: "", selectedModel: "siliconcloud/qwen2.5-vl-7b", confidenceThreshold: 0.7, autoAssignStudents: true })}
              className="px-4 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
            >
              <Play className="w-4 h-4" />
            </button>
          )}
          </div>
        </div>
      </form>

      {/* Camera Modal */}
      {showCamera && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Take Photo</h3>
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
                  Capture
                </button>
                <button
                  onClick={stopCamera}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <canvas ref={canvasRef} className="hidden" />
      </div>
    </div>
  );
}
