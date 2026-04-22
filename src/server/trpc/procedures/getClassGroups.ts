import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { db } from "~/server/db";
import { authedProcedure } from "~/server/trpc/main";

export const getClassGroups = authedProcedure
  .input(z.object({
    classId: z.number(),
  }))
  .query(async ({ input, ctx }) => {
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
          message: "Class not found or you don't have permission to access it",
        });
      }

      // Get all groups for the class
      const groups = await db.studentGroup.findMany({
        where: {
          classId: input.classId,
        },
        include: {
          students: {
            select: {
              id: true,
              name: true,
              studentId: true,
            },
          },
          _count: {
            select: {
              students: true,
            },
          },
        },
        orderBy: {
          createdAt: 'asc',
        },
      });

      return {
        success: true,
        groups,
      };
    } catch (error) {
      if (error instanceof TRPCError) {
        throw error;
      }

      console.error('Get class groups error:', error);
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to get class groups",
      });
    }
  });
