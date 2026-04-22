import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { db } from "~/server/db";
import { authedProcedure } from "~/server/trpc/main";

export const addStudentToClass = authedProcedure
  .input(z.object({ 
    classId: z.number(),
    name: z.string().min(1),
    studentId: z.string().optional(),
    email: z.string().email().optional().or(z.literal("")),
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
          message: "Class not found or you don't have permission to add students to it",
        });
      }

      // Create the student with auto-populated class information
      const student = await db.student.create({
        data: {
          name: input.name,
          studentId: input.studentId,
          email: input.email || undefined,
          schoolName: undefined, // Can be populated later if needed
          grade: undefined, // Can be populated later if needed  
          className: classExists.name, // Use the class name
          classId: input.classId,
        },
        include: {
          _count: {
            select: {
              assignments: true,
              mistakes: true,
            },
          },
        },
      });

      return {
        success: true,
        student,
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
