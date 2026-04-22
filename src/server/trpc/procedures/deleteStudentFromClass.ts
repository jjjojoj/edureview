import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { db } from "~/server/db";
import { authedProcedure } from "~/server/trpc/main";

export const deleteStudentFromClass = authedProcedure
  .input(z.object({
    studentId: z.number(),
  }))
  .mutation(async ({ input, ctx }) => {
    try {
      // Verify teacher authentication
      const teacherClasses = await db.class.findMany({
        where: { teacherId: ctx.auth.teacherId },
        select: { id: true },
      });

      const teacherClassIds = teacherClasses.map(c => c.id);

      // Get the student and verify they're in the teacher's class
      const student = await db.student.findFirst({
        where: {
          id: input.studentId,
          classId: { in: teacherClassIds },
        },
        include: {
          class: true,
          parent: true,
        },
      });

      if (!student) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Student not found or not in your classes",
        });
      }

      // Check if student has linked parent account
      if (student.parentId) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Cannot delete student with a linked parent account. Please unlink the parent first.",
        });
      }

      // Delete all related records in a transaction
      await db.$transaction(async (tx) => {
        // Delete mistakes related to this student
        await tx.mistake.deleteMany({
          where: { studentId: input.studentId },
        });

        // Delete exam mistakes related to this student
        await tx.examMistake.deleteMany({
          where: { studentId: input.studentId },
        });

        // Delete assignment analyses for student's assignments
        const assignments = await tx.assignment.findMany({
          where: { studentId: input.studentId },
          select: { id: true },
        });

        await tx.assignmentAnalysis.deleteMany({
          where: { assignmentId: { in: assignments.map(a => a.id) } },
        });

        // Delete student's assignments
        await tx.assignment.deleteMany({
          where: { studentId: input.studentId },
        });

        // Delete student's exams
        await tx.exam.deleteMany({
          where: { studentId: input.studentId },
        });

        // Delete student's knowledge area progress
        await tx.studentKnowledgeArea.deleteMany({
          where: { studentId: input.studentId },
        });

        // Remove student from any group
        await tx.student.update({
          where: { id: input.studentId },
          data: { groupId: null },
        });

        // Delete the student
        await tx.student.delete({
          where: { id: input.studentId },
        });
      });

      return {
        success: true,
        message: `Student "${student.name}" has been deleted from class "${student.class?.name}"`,
      };
    } catch (error) {
      if (error instanceof TRPCError) {
        throw error;
      }

      console.error('Delete student error:', error);
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to delete student",
      });
    }
  });
