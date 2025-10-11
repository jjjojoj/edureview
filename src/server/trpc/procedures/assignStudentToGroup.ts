import { z } from "zod";
import { TRPCError } from "@trpc/server";
import jwt from "jsonwebtoken";
import { db } from "~/server/db";
import { baseProcedure } from "~/server/trpc/main";
import { env } from "~/server/env";

export const assignStudentToGroup = baseProcedure
  .input(z.object({
    authToken: z.string(),
    studentId: z.number(),
    groupId: z.number().nullable(), // null to remove from group
  }))
  .mutation(async ({ input }) => {
    try {
      // Verify teacher authentication
      const verified = jwt.verify(input.authToken, env.JWT_SECRET);
      const parsed = z.object({ teacherId: z.number() }).parse(verified);

      // Get student details and verify teacher permission
      const student = await db.student.findFirst({
        where: {
          id: input.studentId,
        },
        include: {
          class: true,
          group: true,
        },
      });

      if (!student) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Student not found",
        });
      }

      // Verify that the class belongs to the teacher
      if (student.class.teacherId !== parsed.teacherId) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You don't have permission to modify this student",
        });
      }

      // If assigning to a group, verify the group belongs to the same class
      if (input.groupId) {
        const group = await db.studentGroup.findFirst({
          where: {
            id: input.groupId,
            classId: student.classId!,
          },
        });

        if (!group) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Group not found or doesn't belong to the same class",
          });
        }
      }

      // Update student's group assignment
      const updatedStudent = await db.student.update({
        where: {
          id: input.studentId,
        },
        data: {
          groupId: input.groupId,
        },
        include: {
          group: true,
        },
      });

      return {
        success: true,
        student: {
          id: updatedStudent.id,
          name: updatedStudent.name,
          studentId: updatedStudent.studentId,
          group: updatedStudent.group,
        },
        action: input.groupId ? 'assigned' : 'removed',
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