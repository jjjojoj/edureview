import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useState, useRef, useCallback, useEffect } from "react";
import { useTRPC } from "~/trpc/react";
import { useAuthStore } from "~/stores/authStore";
import {
  X,
  Brain,
} from "lucide-react";
import { useToast } from "~/components/Toast";
import { getErrorMessage } from "~/utils/trpcError";
import { FileUploadZone } from "~/components/assignment/FileUploadZone";
import { AssignmentPreview, type AssignmentFile } from "~/components/assignment/AssignmentPreview";
import { AssignmentConfig } from "~/components/assignment/AssignmentConfig";
import { TeacherCameraCapture } from "~/components/assignment/TeacherCameraCapture";
import { UploadSubmitSection } from "~/components/assignment/UploadSubmitSection";
import { compressImage } from "~/components/assignment/compressImage";

const uploadSchema = z.object({
  title: z.string().min(1, "Assignment title is required"),
  description: z.string().optional(),
  selectedModel: z.string().min(1, "Please select an AI model"),
  confidenceThreshold: z.number().min(0).max(1).default(0.7),
  autoAssignStudents: z.boolean().default(true),
});

type UploadFormData = z.infer<typeof uploadSchema>;

interface EnhancedTeacherAssignmentUploadProps {
  isOpen: boolean;
  classId: number;
  students?: Array<{ id: number; name: string }>;
  onSuccess?: (uploadedCount: number) => void;
  onClose?: () => void;
  maxFiles?: number;
  allowMultiple?: boolean;
  uploadType?: "assignment" | "exam";
}

type UploadQueueStatus = "idle" | "running" | "paused" | "completed";

export function EnhancedTeacherAssignmentUpload({
  isOpen,
  classId,
  students = [],
  onSuccess,
  onClose,
  maxFiles = 10,
  allowMultiple = true,
  uploadType = "assignment",
}: EnhancedTeacherAssignmentUploadProps) {
  const toast = useToast();
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
    staleTime: 5 * 60 * 1000,
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<UploadFormData>({
    resolver: zodResolver(uploadSchema) as any,
    defaultValues: {
      selectedModel: "siliconcloud/qwen2.5-vl-7b",
      confidenceThreshold: 0.7,
      autoAssignStudents: true,
    },
  });

  const confidenceThreshold = watch("confidenceThreshold");
  const autoAssignStudents = watch("autoAssignStudents");

  const presignedUrlMutation = useMutation({
    mutationFn: (data: any) =>
      (trpc as any).generatePresignedUploadUrl.mutateAsync(data),
  });
  const recognizeStudentMutation = useMutation({
    mutationFn: (data: any) =>
      (trpc as any).recognizeStudentInfo.mutateAsync(data),
  });
  const uploadTeacherAssignmentMutation = useMutation({
    mutationFn: (data: any) =>
      (trpc as any).uploadTeacherAssignment.mutateAsync(data),
  });
  const uploadTeacherExamMutation = useMutation({
    mutationFn: (data: any) =>
      (trpc as any).uploadTeacherExam.mutateAsync(data),
  });

  // ─── File management ───────────────────────────────────────────────

  const validateFile = (file: File): string | null => {
    if (!file.type.startsWith("image/")) {
      return "Please select an image file (JPG, PNG, GIF, WebP)";
    }
    if (file.size > 20 * 1024 * 1024) {
      return "File size must be less than 20MB";
    }
    const allowedTypes = [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/gif",
      "image/webp",
    ];
    if (!allowedTypes.includes(file.type)) {
      return "Unsupported file format. Please choose JPG, PNG, GIF, or WebP files";
    }
    return null;
  };

  const addFiles = useCallback(
    async (newFiles: FileList | File[]) => {
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

        const isDuplicate = files.some(
          (f) =>
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
        setFiles((prev) => [...prev, ...validFiles]);
        toast.success(`Added ${validFiles.length} files`);
      }
    },
    [files, maxFiles, toast]
  );

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setDragActive(false);

      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        addFiles(e.dataTransfer.files);
      }
    },
    [addFiles]
  );

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files.length > 0) {
        addFiles(e.target.files);
        e.target.value = "";
      }
    },
    [addFiles]
  );

  // ─── Camera ────────────────────────────────────────────────────────

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setShowCamera(true);
      }
    } catch (error) {
      toast.error("Unable to access camera");
    }
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const context = canvas.getContext("2d");

      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      context?.drawImage(video, 0, 0);

      canvas.toBlob((blob) => {
        if (blob) {
          const file = new File(
            [blob],
            `camera-capture-${Date.now()}.jpg`,
            {
              type: "image/jpeg",
              lastModified: Date.now(),
            }
          );
          addFiles([file]);
          stopCamera();
        }
      }, "image/jpeg", 0.8);
    }
  };

  const stopCamera = () => {
    if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach((track) => track.stop());
      videoRef.current.srcObject = null;
    }
    setShowCamera(false);
  };

  // ─── Upload pipeline ───────────────────────────────────────────────

  const uploadFileToOSS = async (file: File): Promise<string> => {
    try {
      const folderName =
        uploadType === "exam" ? "exam-uploads" : "assignment-uploads";

      const urlResponse: any = await presignedUrlMutation.mutateAsync({
        authToken: authToken!,
        fileName: `teacher-${Date.now()}-${file.name}`,
        fileType: file.type,
        folderName,
      });

      const uploadResponse = await fetch(urlResponse.presignedUrl, {
        method: "PUT",
        body: file,
        headers: {
          "Content-Type": file.type,
        },
      });

      if (!uploadResponse.ok) {
        throw new Error("Failed to upload file");
      }

      return urlResponse.objectUrl;
    } catch (error) {
      throw new Error("Failed to upload file to storage");
    }
  };

  const processFile = async (fileId: string, formData: UploadFormData) => {
    const fileIndex = files.findIndex((f) => f.id === fileId);
    if (fileIndex === -1) return;

    const updateFileStatus = (
      status: AssignmentFile["status"],
      progress: number,
      error?: string,
      updates?: Partial<AssignmentFile>
    ) => {
      setFiles((prev) =>
        prev.map((f) =>
          f.id === fileId ? { ...f, status, progress, error, ...updates } : f
        )
      );
    };

    try {
      const file = files[fileIndex];
      if (!file) return;

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
      const recognition: any = await recognizeStudentMutation.mutateAsync({
        authToken: authToken!,
        imageUrl: fileUrl,
        modelKey: formData.selectedModel,
      });

      if (recognition.success) {
        updateFileStatus("recognizing", 70, undefined, {
          recognition: recognition.recognition,
        });

        // Auto-assign student if confidence is high enough
        let selectedStudentId: number | undefined;

        if (
          autoAssignStudents &&
          recognition.recognition.confidence >= confidenceThreshold
        ) {
          const matchedStudent = students.find(
            (s) =>
              s.name
                .toLowerCase()
                .includes(recognition.recognition.studentName.toLowerCase()) ||
              recognition.recognition.studentName
                .toLowerCase()
                .includes(s.name.toLowerCase())
          );

          if (matchedStudent) {
            selectedStudentId = matchedStudent.id;
            updateFileStatus("recognizing", 80, undefined, {
              selectedStudentId,
            });
            toast.success(`Auto-assigned to ${matchedStudent.name}`);
          }
        }

        // If we have a student assignment or confidence is low, create assignment/exam
        if (selectedStudentId || !autoAssignStudents) {
          updateFileStatus("processing", 85);

          const finalStudentId =
            selectedStudentId || students[0]?.id;

          if (finalStudentId) {
            const uploadMutation =
              uploadType === "exam"
                ? uploadTeacherExamMutation
                : uploadTeacherAssignmentMutation;

            const defaultTitle =
              uploadType === "exam"
                ? `考试 - ${new Date().toLocaleDateString("zh-CN", {
                    year: "numeric",
                    month: "2-digit",
                    day: "2-digit",
                  })}`
                : `作业 - ${new Date().toLocaleDateString("zh-CN", {
                    year: "numeric",
                    month: "2-digit",
                    day: "2-digit",
                  })}`;

            const finalTitle =
              formData.title && formData.title.trim()
                ? formData.title
                : defaultTitle;

            await uploadMutation.mutateAsync({
              authToken: authToken!,
              studentId: finalStudentId,
              title: `${finalTitle} - ${file.file.name}`,
              description: formData.description,
              imageUrl: fileUrl,
            });

            updateFileStatus("complete", 100);
            setCompletedCount((prev) => prev + 1);
          } else {
            throw new Error("No student available for assignment");
          }
        } else {
          // Low confidence, needs manual assignment
          updateFileStatus(
            "complete",
            100,
            undefined,
            {
              recognition: recognition.recognition,
              uploadedImageUrl: fileUrl,
            }
          );
          setCompletedCount((prev) => prev + 1);
          toast(
            `${file.file.name} uploaded but needs manual student assignment (confidence: ${Math.round(recognition.recognition.confidence * 100)}%)`,
            {
              icon: "⚠️",
              style: {
                background: "#f59e0b",
                color: "white",
              },
            }
          );
        }
      } else {
        throw new Error("AI recognition failed");
      }
    } catch (error: unknown) {
      const file = files[fileIndex];

      if (file && file.retryCount < 3) {
        setFiles((prev) =>
          prev.map((f) =>
            f.id === fileId
              ? {
                  ...f,
                  status: "error",
                  error: getErrorMessage(error),
                  retryCount: f.retryCount + 1,
                }
              : f
          )
        );
      } else {
        updateFileStatus("error", 0, getErrorMessage(error));
      }
    }
  };

  const startQueue = async (formData: UploadFormData) => {
    if (!authToken) {
      toast.error("Please login first");
      return;
    }

    setQueueStatus("running");
    setCompletedCount(0);

    const pendingFiles = files.filter(
      (f) => f.status === "pending" || f.status === "error"
    );

    for (const file of pendingFiles) {
      if (queueStatus === "paused") break;
      await processFile(file.id, formData);
    }

    setQueueStatus("completed");

    const successCount = files.filter((f) => f.status === "complete").length;
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
    setFiles((prev) =>
      prev.map((f) =>
        f.id === fileId
          ? { ...f, status: "pending", error: undefined }
          : f
      )
    );
    processFile(fileId, formData);
  };

  const removeFile = (fileId: string) => {
    setFiles((prev) => {
      const file = prev.find((f) => f.id === fileId);
      if (file) {
        URL.revokeObjectURL(file.previewUrl);
      }
      return prev.filter((f) => f.id !== fileId);
    });
  };

  const clearCompleted = () => {
    setFiles((prev) => {
      const completedFiles = prev.filter((f) => f.status === "complete");
      completedFiles.forEach((file) => URL.revokeObjectURL(file.previewUrl));
      return prev.filter((f) => f.status !== "complete");
    });
  };

  const assignStudentToFile = (fileId: string, studentId: number) => {
    setFiles((prev) =>
      prev.map((f) =>
        f.id === fileId ? { ...f, selectedStudentId: studentId } : f
      )
    );
  };

  const onSubmit = (data: UploadFormData) => {
    if (files.length === 0) {
      toast.error("Please select at least one file");
      return;
    }
    startQueue(data);
  };

  // Cleanup URLs on unmount
  useEffect(() => {
    return () => {
      files.forEach((file) => URL.revokeObjectURL(file.previewUrl));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!isOpen) return null;

  const defaultResumeData: UploadFormData = {
    title: "Resume",
    description: "",
    selectedModel: "siliconcloud/qwen2.5-vl-7b",
    confidenceThreshold: 0.7,
    autoAssignStudents: true,
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden max-w-6xl mx-auto w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Brain className="w-6 h-6 text-blue-600 mr-3" />
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  Enhanced{" "}
                  {uploadType === "exam" ? "Exam" : "Assignment"} Upload
                </h3>
                <p className="text-sm text-gray-600">
                  AI驱动的批量上传：自动识别学生信息、智能分配作业、支持拖拽上传
                </p>
                <div className="mt-2 flex flex-wrap gap-2 text-xs">
                  <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded-lg">
                    ✨ AI识别学生姓名
                  </span>
                  <span className="bg-green-100 text-green-700 px-2 py-1 rounded-lg">
                    🚀 批量处理
                  </span>
                  <span className="bg-purple-100 text-purple-700 px-2 py-1 rounded-lg">
                    📱 支持拍照
                  </span>
                  <span className="bg-orange-100 text-orange-700 px-2 py-1 rounded-lg">
                    🗜️ 自动压缩
                  </span>
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

        <form onSubmit={handleSubmit(onSubmit as any)} className="p-6 space-y-6">
          {/* Configuration */}
          <AssignmentConfig
            uploadType={uploadType}
            register={register}
            watch={watch}
            errors={errors}
            showAdvancedSettings={showAdvancedSettings}
            onToggleAdvancedSettings={() =>
              setShowAdvancedSettings(!showAdvancedSettings)
            }
            models={modelsQuery.data?.models}
          />

          {/* File Upload Zone */}
          <FileUploadZone
            dragActive={dragActive}
            onDrag={handleDrag}
            onDrop={handleDrop}
            onFileSelect={handleFileSelect}
            onStartCamera={startCamera}
            maxFiles={maxFiles}
            allowMultiple={allowMultiple}
            uploadType={uploadType}
          />

          {/* Preview & Queue */}
          <AssignmentPreview
            files={files}
            maxFiles={maxFiles}
            students={students}
            confidenceThreshold={confidenceThreshold}
            queueStatus={queueStatus}
            completedCount={completedCount}
            onRemoveFile={removeFile}
            onClearCompleted={clearCompleted}
            onRetryFile={(fileId) =>
              retryFile(fileId, {
                title: "Retry",
                description: "",
                selectedModel: "siliconcloud/qwen2.5-vl-7b",
                confidenceThreshold: 0.7,
                autoAssignStudents: true,
              })
            }
            onAssignStudentToFile={assignStudentToFile}
          />

          {/* Submit Section */}
          <UploadSubmitSection
            uploadType={uploadType}
            files={files}
            queueStatus={queueStatus}
            completedCount={completedCount}
            onPause={pauseQueue}
            onResume={() => resumeQueue(defaultResumeData)}
          />
        </form>

        {/* Camera Modal */}
        <TeacherCameraCapture
          isOpen={showCamera}
          videoRef={videoRef}
          canvasRef={canvasRef}
          onCapture={capturePhoto}
          onClose={stopCamera}
        />

        <canvas ref={canvasRef} className="hidden" />
      </div>
    </div>
  );
}
