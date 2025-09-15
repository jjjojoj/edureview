import { z } from "zod";
import { TRPCError } from "@trpc/server";
import jwt from "jsonwebtoken";
import { db } from "~/server/db";
import { baseProcedure } from "~/server/trpc/main";
import { env } from "~/server/env";

export const getTeachingMaterials = baseProcedure
  .input(z.object({
    authToken: z.string(),
    knowledgeAreaId: z.number().optional(),
    contentType: z.enum(["document", "image", "text", "video", "audio", "other"]).optional(),
  }))
  .query(async ({ input }) => {
    try {
      // Verify teacher authentication
      const verified = jwt.verify(input.authToken, env.JWT_SECRET);
      const parsed = z.object({ teacherId: z.number() }).parse(verified);

      // Build where clause based on filters
      const whereClause: any = {
        teacherId: parsed.teacherId,
      };

      if (input.knowledgeAreaId) {
        whereClause.knowledgeAreaId = input.knowledgeAreaId;
      }

      if (input.contentType) {
        whereClause.contentType = input.contentType;
      }

      // Fetch teaching materials
      const materials = await db.teachingMaterial.findMany({
        where: whereClause,
        include: {
          knowledgeArea: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      return {
        success: true,
        materials: materials.map(material => ({
          id: material.id,
          title: material.title,
          description: material.description,
          contentType: material.contentType,
          fileUrl: material.fileUrl,
          textContent: material.textContent,
          knowledgeArea: material.knowledgeArea,
          createdAt: material.createdAt,
          updatedAt: material.updatedAt,
        })),
      };
    } catch (error) {
      console.error("Get teaching materials error:", error);
      
      if (error instanceof TRPCError) {
        throw error;
      }

      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to fetch teaching materials",
      });
    }
  });
