import { z } from "zod";

export const uploadSchema = z.object({
  title: z.string().min(1, "作业标题不能为空"),
  description: z.string().optional(),
});

export type UploadFormData = z.infer<typeof uploadSchema>;

export interface AssignmentFile {
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

export interface EnhancedAssignmentUploadProps {
  childId: number;
  onSuccess?: (uploadedCount: number) => void;
  onClose?: () => void;
  maxFiles?: number;
  allowMultiple?: boolean;
}

export type UploadQueueStatus = "idle" | "running" | "paused" | "completed";
