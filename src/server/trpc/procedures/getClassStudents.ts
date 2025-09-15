import { z } from "zod";
import { TRPCError } from "@trpc/server";
import jwt from "jsonwebtoken";
import { db } from "~/server/db";
import { baseProcedure } from "~/server/trpc/main";
import { env } from "~/server/env";

export const getClassStudents = baseProcedure
  .input(z.object({ 
    authToken: z.string(),
    classId: z.number(),
  }))
  .query(async ({ input }) => {
    try {
      // Verify teacher authentication
      const verified = jwt.verify(input.authToken, env.JWT_SECRET);
      const parsed = z.object({ teacherId: z.number() }).parse(verified);

      // Get the class and verify ownership
      const classData = await db.class.findFirst({
        where: {
          id: input.classId,
          teacherId: parsed.teacherId,
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
