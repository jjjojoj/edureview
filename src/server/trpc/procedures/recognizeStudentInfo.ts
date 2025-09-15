import { z } from "zod";
import { TRPCError } from "@trpc/server";
import jwt from "jsonwebtoken";
import { recognizeStudentInfo, getAvailableVisionModels, type AIModelKey } from "~/server/ai-service";
import { baseProcedure } from "~/server/trpc/main";
import { env } from "~/server/env";
import { ossClient } from "~/server/storage";

export const recognizeStudentInfoProcedure = baseProcedure
  .input(z.object({
    authToken: z.string(),
    imageUrl: z.string(),
    modelKey: z.string().optional(),
  }))
  .mutation(async ({ input }) => {
    try {
      console.log("Starting recognition process for URL:", input.imageUrl);
      
      // Verify teacher authentication
      const verified = jwt.verify(input.authToken, env.JWT_SECRET);
      const parsed = z.object({ teacherId: z.number() }).parse(verified);
      console.log("Teacher authentication verified for ID:", parsed.teacherId);

      // Extract object key from OSS URL
      const ossUrlPattern = new RegExp(`https://${env.OSS_BUCKET}\\.${env.OSS_ENDPOINT}/(.+)`);
      const match = input.imageUrl.match(ossUrlPattern);
      
      if (!match) {
        console.error("Invalid OSS URL format:", input.imageUrl);
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Invalid image URL format",
        });
      }

      const objectKey = match[1];
      console.log("Fetching image from OSS with key:", objectKey);

      // Fetch the image data from OSS using authenticated client
      try {
        const result = await ossClient.get(objectKey);
        console.log("OSS fetch successful, content length:", result.content?.length || 0);
        
        if (!result.content) {
          throw new Error("Empty image content");
        }

        const imageBuffer = Buffer.from(result.content);
        console.log("Image buffer size:", imageBuffer.length, "bytes");

        // Use specified model or default
        const modelKey = (input.modelKey as AIModelKey) || 'alibabacloud/qwen-vl-max';
        console.log("Using AI model:", modelKey);
        
        // Recognize student information
        console.log("Starting AI recognition...");
        const recognition = await recognizeStudentInfo(imageBuffer, modelKey);
        console.log("AI recognition completed:", recognition);

        return {
          success: true,
          recognition,
          modelUsed: modelKey,
        };
      } catch (ossError) {
        console.error("Failed to fetch image from OSS:", ossError);
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Could not fetch assignment image from storage",
        });
      }
    } catch (error) {
      console.error("Student recognition error:", error);
      
      if (error instanceof TRPCError) {
        throw error;
      }
      
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to recognize student information",
      });
    }
  });

export const getAvailableModelsProcedure = baseProcedure
  .query(() => {
    return {
      models: getAvailableVisionModels(),
    };
  });
