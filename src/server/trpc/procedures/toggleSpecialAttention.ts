import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { db } from "~/server/db";
import { authedProcedure } from "~/server/trpc/main";

export const toggleSpecialAttention = authedProcedure
  .input(z.object({
    studentId: z.number(),
  }))
  .mutation(async ({ input, ctx }) => {
    try {
      // Get student details and verify teacher permission
      const student = await db.student.findFirst({
        where: {
          id: input.studentId,
        },
        include: {
          class: true,
        },
      });

      if (!student) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Student not found",
        });
      }

      // Verify that the class belongs to the teacher
      if (!student.class || student.class.teacherId !== ctx.auth.teacherId) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You don't have permission to modify this student",
        });
      }

      // Toggle the special attention status
      const updatedStudent = await db.student.update({
        where: {
          id: input.studentId,
        },
        data: {
          specialAttention: !student.specialAttention,
        },
        select: {
          id: true,
          name: true,
          specialAttention: true,
        },
      });

      return {
        success: true,
        student: updatedStudent,
        action: updatedStudent.specialAttention ? 'added' : 'removed',
      };
    } catch (error) {
      if (error instanceof TRPCError) {
        throw error;
      }

      console.error('Toggle special attention error:', error);
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to toggle special attention",
      });
    }
  });
