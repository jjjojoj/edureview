import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { db } from "~/server/db";
import { authedProcedure } from "~/server/trpc/main";

export const getTeachingMaterials = authedProcedure
  .input(z.object({
    knowledgeAreaId: z.number().optional(),
    contentType: z.enum(["document", "image", "text", "video", "audio", "other"]).optional(),
  }))
  .query(async ({ input, ctx }) => {
    try {
      // Build where clause based on filters
      const whereClause: any = {
        teacherId: ctx.auth.teacherId,
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
