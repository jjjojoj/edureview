import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { db } from "~/server/db";
import { authedProcedure } from "~/server/trpc/main";

export const createStudentGroup = authedProcedure
  .input(z.object({
    classId: z.number(),
    name: z.string().min(1),
    description: z.string().optional(),
    color: z.string().default("blue"),
  }))
  .mutation(async ({ input, ctx }) => {
    try {
      // Verify that the class belongs to the teacher
      const classExists = await db.class.findFirst({
        where: {
          id: input.classId,
          teacherId: ctx.auth.teacherId,
        },
      });

      if (!classExists) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Class not found or you don't have permission to create groups in it",
        });
      }

      // Check if a group with the same name already exists in this class
      const existingGroup = await db.studentGroup.findFirst({
        where: {
          classId: input.classId,
          name: input.name,
        },
      });

      if (existingGroup) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "A group with this name already exists in the class",
        });
      }

      // Create the group
      const group = await db.studentGroup.create({
        data: {
          name: input.name,
          description: input.description,
          color: input.color,
          classId: input.classId,
        },
        include: {
          _count: {
            select: {
              students: true,
            },
          },
        },
      });

      return {
        success: true,
        group,
      };
    } catch (error) {
      if (error instanceof TRPCError) {
        throw error;
      }

      console.error('Create student group error:', error);
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to create student group",
      });
    }
  });
