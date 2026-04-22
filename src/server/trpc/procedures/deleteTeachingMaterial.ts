import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { db } from "~/server/db";
import { authedProcedure } from "~/server/trpc/main";

export const deleteTeachingMaterial = authedProcedure
  .input(z.object({
    materialId: z.number(),
  }))
  .mutation(async ({ input, ctx }) => {
    try {
      // Check if the material exists and belongs to the teacher
      const material = await db.teachingMaterial.findUnique({
        where: { id: input.materialId },
      });

      if (!material) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Teaching material not found",
        });
      }

      if (material.teacherId !== ctx.auth.teacherId) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You can only delete your own teaching materials",
        });
      }

      // Delete the material
      await db.teachingMaterial.delete({
        where: { id: input.materialId },
      });

      return {
        success: true,
        message: "Teaching material deleted successfully",
      };
    } catch (error) {
      console.error("Delete teaching material error:", error);
      
      if (error instanceof TRPCError) {
        throw error;
      }

      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to delete teaching material",
      });
    }
  });
