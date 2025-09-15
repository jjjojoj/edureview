import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useState, useRef, useEffect } from "react";
import { useTRPC } from "~/trpc/react";
import { useAuthStore } from "~/stores/authStore";
import { Upload, Camera, FileText, Loader2, CheckCircle, AlertCircle, X, Brain, Eye } from "lucide-react";
import toast from "react-hot-toast";

const uploadSchema = z.object({
  title: z.string().min(1, "Assignment title is required"),
  description: z.string().optional(),
  recognizedStudentName: z.string().optional(),
  recognizedClassName: z.string().optional(),
  selectedStudentId: z.number().min(1, "Please select a student"),
  selectedModel: z.string().min(1, "Please select an AI model"),
});

type UploadFormData = z.infer<typeof uploadSchema>;

interface TeacherAssignmentUploadProps {
  classId: number;
  students: Array<{ id: number; name: string; }>;
  onSuccess?: () => void;
  onClose?: () => void;
}

type UploadStatus = "idle" | "uploading" | "recognizing" | "processing" | "analyzing" | "complete" | "error";

interface RecognitionResult {
  studentName: string;
  className: string;
  confidence: number;
  reasoning: string;
}

export function TeacherAssignmentUpload({ classId, students, onSuccess, onClose }: TeacherAssignmentUploadProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadStatus, setUploadStatus] = useState<UploadStatus>("idle");
  const [uploadProgress, setUploadProgress] = useState(0);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [recognitionResult, setRecognitionResult] = useState<RecognitionResult | null>(null);
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string | null>(null);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
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
      selectedModel: 'siliconcloud/qwen2.5-vl-7b', // Default to SiliconCloud budget option
    },
  });

  const selectedModel = watch('selectedModel');

  const presignedUrlMutation = useMutation(trpc.generatePresignedUploadUrl.mutationOptions());
  const recognizeStudentMutation = useMutation(trpc.recognizeStudentInfo.mutationOptions());
  const uploadTeacherAssignmentMutation = useMutation(trpc.uploadTeacherAssignment.mutationOptions());

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast.error('Please select an image file');
        return;
      }

      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        toast.error('File size must be less than 10MB');
        return;
      }

      setSelectedFile(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreviewUrl(e.target?.result as string);
      };
      reader.readAsDataURL(file);

      // Automatically upload image and recognize student info
      await handleImageUploadAndRecognition(file);
    }
  };

  const handleImageUploadAndRecognition = async (file: File) => {
    if (!authToken) return;

    try {
      // Step 1: Upload image to OSS
      setUploadStatus("uploading");
      setUploadProgress(25);

      const fileUrl = await uploadFileToOSS(file);
      setUploadedImageUrl(fileUrl);

      // Step 2: Recognize student info
      setUploadStatus("recognizing");
      setUploadProgress(50);

      console.log('Starting client-side recognition call...');
      console.log('Auth token present:', !!authToken);
      console.log('Image URL:', fileUrl);
      console.log('Selected model:', selectedModel);

      const recognition = await recognizeStudentMutation.mutateAsync({
        authToken,
        imageUrl: fileUrl,
        modelKey: selectedModel,
      });

      console.log('Recognition response received:', recognition);

      if (recognition.success) {
        setRecognitionResult(recognition.recognition);
        
        // Pre-fill recognized values
        setValue('recognizedStudentName', recognition.recognition.studentName);
        setValue('recognizedClassName', recognition.recognition.className);

        // Try to auto-select student if recognition confidence is high
        if (recognition.recognition.confidence > 0.7 && recognition.recognition.studentName) {
          const matchedStudent = students.find(s => 
            s.name.toLowerCase().includes(recognition.recognition.studentName.toLowerCase()) ||
            recognition.recognition.studentName.toLowerCase().includes(s.name.toLowerCase())
          );
          
          if (matchedStudent) {
            setValue('selectedStudentId', matchedStudent.id);
            toast.success(`Auto-detected student: ${matchedStudent.name}`);
          }
        }

        setUploadStatus("idle");
        setUploadProgress(100);
        setShowConfirmation(true);

        toast.success('Image uploaded and analyzed! Please confirm the recognized information.');
      }
    } catch (error) {
      console.error('Recognition error:', error);
      setUploadStatus("error");
      toast.error('Failed to recognize student information');
    }
  };

  const uploadFileToOSS = async (file: File): Promise<string> => {
    try {
      // Generate presigned URL
      console.log('Generating presigned URL...', file.type, file.size);
      const urlResponse = await presignedUrlMutation.mutateAsync({
        authToken: authToken!,
        fileName: `teacher-${Date.now()}-${file.name}`,
        fileType: file.type,
        folderName: "assignment-uploads",
      });

      console.log('Uploading directly to OSS...');
      
      // Upload directly to OSS using presigned URL
      const uploadResponse = await fetch(urlResponse.presignedUrl, {
        method: 'PUT',
        body: file,
        headers: {
          'Content-Type': file.type,
        },
      });

      if (!uploadResponse.ok) {
        throw new Error(`Upload failed: ${uploadResponse.status} ${uploadResponse.statusText}`);
      }

      console.log('Upload successful:', urlResponse.objectUrl);
      return urlResponse.objectUrl;
    } catch (error) {
      console.error('OSS upload error:', error);
      throw new Error('Failed to upload file to storage');
    }
  };

  const onSubmit = async (data: UploadFormData) => {
    if (!uploadedImageUrl || !authToken) {
      toast.error('Please upload an image first');
      return;
    }

    try {
      setUploadStatus("processing");
      setUploadProgress(75);

      // Create assignment record with the already uploaded image
      await uploadTeacherAssignmentMutation.mutateAsync({
        authToken: authToken!,
        studentId: data.selectedStudentId,
        title: data.title,
        description: data.description,
        imageUrl: uploadedImageUrl,
      });

      setUploadProgress(100);
      setUploadStatus("complete");

      toast.success('Assignment uploaded successfully!');
      
      // Reset form
      reset();
      setSelectedFile(null);
      setPreviewUrl(null);
      setRecognitionResult(null);
      setUploadedImageUrl(null);
      setShowConfirmation(false);
      
      // Call success callback
      onSuccess?.();
      
    } catch (error: any) {
      console.error('Upload error:', error);
      setUploadStatus("error");
      toast.error(error.message || 'Failed to upload assignment');
    }
  };

  const getStatusMessage = () => {
    switch (uploadStatus) {
      case "uploading": return "Uploading image...";
      case "recognizing": return "Recognizing student information...";
      case "processing": return "Creating assignment record...";
      case "complete": return "Upload complete!";
      case "error": return "Upload failed";
      default: return "";
    }
  };

  const getStatusIcon = () => {
    switch (uploadStatus) {
      case "uploading":
      case "processing":
        return <Loader2 className="w-5 h-5 animate-spin" />;
      case "recognizing":
        return <Brain className="w-5 h-5 animate-pulse text-blue-600" />;
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
            <Camera className="w-6 h-6 text-blue-600 mr-3" />
            <h3 className="text-lg font-semibold text-gray-900">Upload Assignment</h3>
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
          Upload a student's assignment for analysis and feedback
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6">
        {/* AI Model Selection */}
        <div>
          <label htmlFor="selectedModel" className="block text-sm font-medium text-gray-700 mb-2">
            AI Model for Recognition
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
          {errors.selectedModel && (
            <p className="text-red-600 text-sm mt-1">{errors.selectedModel.message}</p>
          )}
        </div>

        {/* Student Selection */}
        <div>
          <label htmlFor="selectedStudentId" className="block text-sm font-medium text-gray-700 mb-2">
            Select Student
          </label>
          <select
            {...register("selectedStudentId", { valueAsNumber: true })}
            id="selectedStudentId"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
          >
            <option value="">Choose a student...</option>
            {students.map((student) => (
              <option key={student.id} value={student.id}>
                {student.name}
              </option>
            ))}
          </select>
          {errors.selectedStudentId && (
            <p className="text-red-600 text-sm mt-1">{errors.selectedStudentId.message}</p>
          )}
        </div>

        {/* File Upload */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Assignment Image
          </label>
          
          {!selectedFile ? (
            <div 
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-400 hover:bg-blue-50 transition-all cursor-pointer group"
            >
              <Camera className="w-12 h-12 text-gray-400 group-hover:text-blue-600 mx-auto mb-4" />
              <h4 className="text-lg font-medium text-gray-900 group-hover:text-blue-700 mb-2">
                Choose Assignment Photo
              </h4>
              <p className="text-gray-500">
                Click to select an image file (JPG, PNG, etc.)
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
            Assignment Title
          </label>
          <input
            {...register("title")}
            type="text"
            id="title"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
            placeholder="e.g., Math Homework Chapter 5"
          />
          {errors.title && (
            <p className="text-red-600 text-sm mt-1">{errors.title.message}</p>
          )}
        </div>

        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
            Description (Optional)
          </label>
          <textarea
            {...register("description")}
            id="description"
            rows={3}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
            placeholder="Add any additional notes about this assignment..."
          />
        </div>

        {/* Recognition Results */}
        {recognitionResult && showConfirmation && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center mb-3">
              <Brain className="w-5 h-5 text-blue-600 mr-2" />
              <h4 className="font-medium text-blue-900">AI Recognition Results</h4>
              <span className="ml-auto text-sm text-blue-600">
                {Math.round(recognitionResult.confidence * 100)}% confidence
              </span>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Recognized Student Name
                </label>
                <div className="px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm">
                  {recognitionResult.studentName || "Not detected"}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Recognized Class
                </label>
                <div className="px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm">
                  {recognitionResult.className || "Not detected"}
                </div>
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                AI Reasoning
              </label>
              <div className="px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm text-gray-600">
                {recognitionResult.reasoning}
              </div>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-blue-200">
              <p className="text-sm text-blue-700">
                Please verify the recognized information is correct before proceeding
              </p>
              <div className="flex items-center">
                <Eye className="w-4 h-4 text-blue-600 mr-1" />
                <span className="text-sm text-blue-600">Ready for review</span>
              </div>
            </div>
          </div>
        )}

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
                className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                style={{ width: `${uploadProgress}%` }}
              ></div>
            </div>
          </div>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          disabled={
            !selectedFile || 
            !uploadedImageUrl || 
            uploadStatus === "uploading" || 
            uploadStatus === "processing" ||
            uploadStatus === "recognizing" ||
            (showConfirmation && !watch('selectedStudentId'))
          }
          className="w-full bg-gradient-to-r from-blue-500 to-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:from-blue-600 hover:to-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {uploadStatus === "uploading" ? (
            <>
              <Upload className="w-4 h-4 inline mr-2 animate-spin" />
              Uploading Image...
            </>
          ) : uploadStatus === "recognizing" ? (
            <>
              <Brain className="w-4 h-4 inline mr-2 animate-pulse" />
              Recognizing Student Info...
            </>
          ) : uploadStatus === "processing" ? (
            <>
              <Loader2 className="w-4 h-4 inline mr-2 animate-spin" />
              Processing...
            </>
          ) : uploadStatus === "complete" ? (
            <>
              <CheckCircle className="w-4 h-4 inline mr-2" />
              Upload Another
            </>
          ) : showConfirmation ? (
            <>
              <CheckCircle className="w-4 h-4 inline mr-2" />
              Confirm & Upload Assignment
            </>
          ) : (
            <>
              <Upload className="w-4 h-4 inline mr-2" />
              Upload Assignment
            </>
          )}
        </button>

        {/* Confirmation Helper Text */}
        {showConfirmation && !watch('selectedStudentId') && (
          <p className="text-sm text-amber-600 text-center">
            Please select a student to proceed with the assignment upload
          </p>
        )}
      </form>
    </div>
  );
}