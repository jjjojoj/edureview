import { z } from "zod";
import { TRPCError } from "@trpc/server";
import jwt from "jsonwebtoken";
import { ossClient } from "~/server/storage";
import { baseProcedure } from "~/server/trpc/main";
import { env } from "~/server/env";

export const uploadFileToOSS = baseProcedure
  .input(z.object({
    authToken: z.string(),
    fileData: z.string(), // base64 encoded file data
    fileName: z.string(),
    fileType: z.string(),
    folderName: z.enum(["assignment-uploads", "student-reports"]),
  }))
  .mutation(async ({ input }) => {
    try {
      // Verify teacher authentication
      const verified = jwt.verify(input.authToken, env.JWT_SECRET);
      const parsed = z.object({ teacherId: z.number() }).parse(verified);

      // Generate a unique file name with timestamp
      const timestamp = Date.now();
      const uniqueFileName = `${input.folderName}/teacher-${parsed.teacherId}/${timestamp}-${input.fileName}`;

      // Convert base64 to buffer
      const base64Data = input.fileData.replace(/^data:image\/[a-z]+;base64,/, "");
      const fileBuffer = Buffer.from(base64Data, 'base64');

      // Upload directly to OSS from server
      const result = await ossClient.put(uniqueFileName, fileBuffer, {
        headers: {
          'Content-Type': input.fileType,
        },
      });

      console.log('File uploaded successfully to OSS:', result.url);

      return {
        success: true,
        url: result.url,
        fileName: uniqueFileName,
      };
    } catch (error) {
      console.error("OSS upload error:", error);
      
      if (error instanceof Error && error.message.includes('jwt')) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Invalid or expired token",
        });
      }
      
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to upload file to OSS",
      });
    }
  });