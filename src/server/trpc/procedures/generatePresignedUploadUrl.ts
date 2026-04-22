import { z } from "zod";
import { TRPCError } from "@trpc/server";
import jwt from "jsonwebtoken";
import { ossClient, getOSSObjectUrl } from "~/server/storage";
import { baseProcedure } from "~/server/trpc/main";
import { env } from "~/server/env";

const ALLOWED_FILE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "image/heic",
  "image/heif",
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
] as const;

export const generatePresignedUploadUrl = baseProcedure
  .input(z.object({ 
    authToken: z.string(),
    fileName: z.string().max(255).regex(/^[^/\\]+$/, "文件名不能包含路径分隔符"),
    fileType: z.enum(ALLOWED_FILE_TYPES, { message: "不支持的文件类型" }),
    folderName: z.enum(["assignment-uploads", "exam-uploads", "student-reports", "teaching-materials"]),
  }))
  .mutation(async ({ input }) => {
    try {
      // Verify teacher authentication
      const verified = jwt.verify(input.authToken, env.JWT_SECRET);
      const parsed = z.object({ teacherId: z.number() }).parse(verified);

      // Generate a unique file name with timestamp
      const timestamp = Date.now();
      const uniqueFileName = `${input.folderName}/teacher-${parsed.teacherId}/${timestamp}-${input.fileName}`;

      // Generate presigned URL for upload (expires in 1 hour)
      const presignedUrl = await ossClient.signatureUrl(uniqueFileName, {
        method: 'PUT',
        expires: 3600, // 1 hour expiry
        'Content-Type': input.fileType,
      });

      // Generate the final object URL
      const objectUrl = getOSSObjectUrl(uniqueFileName);

      return {
        presignedUrl,
        objectUrl,
        fileName: uniqueFileName,
      };
    } catch (error) {
      console.error("Presigned URL generation error:", error);
      throw new TRPCError({
        code: "UNAUTHORIZED",
        message: "Invalid or expired token",
      });
    }
  });
