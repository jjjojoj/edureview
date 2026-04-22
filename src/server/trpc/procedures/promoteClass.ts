import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { db } from "~/server/db";
import { authedProcedure } from "~/server/trpc/main";

export const promoteClass = authedProcedure
  .input(z.object({ 
    oldClassId: z.number(),
    newClassName: z.string().min(1, "新班级名称不能为空").max(100, "班级名称过长"),
    newGrade: z.string().min(1, "年级不能为空").max(20, "年级名称过长"),
  }))
  .mutation(async ({ input, ctx }) => {
    try {
      // Verify old class ownership and ensure it's active
      const oldClass = await db.class.findFirst({
        where: {
          id: input.oldClassId,
          teacherId: ctx.auth.teacherId,
          status: 'active',
        },
        include: {
          students: true,
        },
      });

      if (!oldClass) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Class not found, already archived, or you don't have permission to promote it",
        });
      }

      // Generate invitation code for new class
      const generateInvitationCode = () => {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let result = '';
        for (let i = 0; i < 6; i++) {
          result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return result;
      };

      let invitationCode = generateInvitationCode();
      
      // Ensure invitation code is unique
      let existingClass = await db.class.findUnique({
        where: { invitationCode },
      });
      
      while (existingClass) {
        invitationCode = generateInvitationCode();
        existingClass = await db.class.findUnique({
          where: { invitationCode },
        });
      }

      // Create new class
      const newClass = await db.class.create({
        data: {
          name: input.newClassName,
          description: `${oldClass.description ? oldClass.description + ' - ' : ''}升级到${input.newGrade}`,
          teacherId: ctx.auth.teacherId,
          invitationCode,
          invitationCodeExpiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours from now
          initialStudentCount: oldClass.students.length,
        },
      });

      // Move students to new class and update their grade
      const updatedStudents = await Promise.all(
        oldClass.students.map(student => 
          db.student.update({
            where: { id: student.id },
            data: {
              classId: newClass.id,
              grade: input.newGrade,
              className: input.newClassName,
            },
          })
        )
      );

      // Archive old class and link it to the new class
      const archivedOldClass = await db.class.update({
        where: { id: input.oldClassId },
        data: {
          status: 'archived',
          archivedAt: new Date(),
          promotedToClassId: newClass.id,
        },
      });

      return {
        success: true,
        message: `班级已成功升级到${input.newGrade}`,
        oldClass: {
          id: archivedOldClass.id,
          name: archivedOldClass.name,
          status: archivedOldClass.status,
          archivedAt: archivedOldClass.archivedAt,
        },
        newClass: {
          id: newClass.id,
          name: newClass.name,
          invitationCode: newClass.invitationCode,
          studentCount: updatedStudents.length,
        },
        movedStudents: updatedStudents.map(student => ({
          id: student.id,
          name: student.name,
          newGrade: student.grade,
        })),
      };

    } catch (error) {
      console.error('Error promoting class:', error);
      if (error instanceof TRPCError) {
        throw error;
      }
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to promote class",
      });
    }
  });
