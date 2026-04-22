import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { db } from "~/server/db";
import { authedProcedure } from "~/server/trpc/main";

export const getClassStudents = authedProcedure
  .input(z.object({ 
    classId: z.number(),
  }))
  .query(async ({ input, ctx }) => {
    try {
      // Get the class and verify ownership
      const classData = await db.class.findFirst({
        where: {
          id: input.classId,
          teacherId: ctx.auth.teacherId,
        },
      });

      if (!classData) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Class not found or you don't have permission to view it",
        });
      }

      // Get students in the class
      const students = await db.student.findMany({
        where: {
          classId: input.classId,
        },
        include: {
          _count: {
            select: {
              assignments: true,
              exams: true,
              mistakes: true,
              examMistakes: true,
            },
          },
          studentKnowledgeAreas: {
            include: {
              knowledgeArea: true,
            },
          },
          group: true,
        },
        orderBy: {
          name: 'asc',
        },
      });

      return {
        class: classData,
        students,
      };
    } catch (error) {
      if (error instanceof TRPCError) {
        throw error;
      }
      throw new TRPCError({
        code: "UNAUTHORIZED",
        message: "Invalid or expired token",
      });
    }
  });
