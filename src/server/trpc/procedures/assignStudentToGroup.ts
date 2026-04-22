import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { db } from "~/server/db";
import { authedProcedure } from "~/server/trpc/main";

export const assignStudentToGroup = authedProcedure
  .input(z.object({
    studentId: z.number(),
    groupId: z.number(),
  }))
  .mutation(async ({ input, ctx }) => {
    try {
      // Verify teacher authentication - get teacher's classes
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
      });

      if (!student) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Student not found or not in your classes",
        });
      }

      // Get the group and verify it's in the same class
      const group = await db.studentGroup.findFirst({
        where: {
          id: input.groupId,
          classId: student.classId,
        },
      });

      if (!group) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Group not found or not in the same class as the student",
        });
      }

      // Assign student to group
      const updated = await db.student.update({
        where: { id: input.studentId },
        data: { groupId: input.groupId },
        include: {
          group: true,
          class: true,
        },
      });

      return {
        success: true,
        student: {
          id: updated.id,
          name: updated.name,
          groupId: updated.groupId,
          groupName: updated.group?.name,
        },
      };
    } catch (error) {
      if (error instanceof TRPCError) {
        throw error;
      }

      console.error('Assign student to group error:', error);
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to assign student to group",
      });
    }
  });
