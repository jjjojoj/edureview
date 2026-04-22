import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { db } from "~/server/db";
import { authedProcedure } from "~/server/trpc/main";

// Schema for individual student to be added
const StudentToAddSchema = z.object({
  name: z.string().min(1, "学生姓名不能为空"),
  studentId: z.string().optional(),
});

export const batchAddStudentsToClass = authedProcedure
  .input(z.object({
    classId: z.number(),
    students: z.array(StudentToAddSchema).min(1, "至少需要添加一个学生"),
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

      // Check for duplicate student IDs within the input
      const studentIds = input.students
        .map(s => s.studentId)
        .filter(Boolean) as string[];

      const duplicateIds = studentIds.filter(
        (id, index) => studentIds.indexOf(id) !== index
      );

      if (duplicateIds.length > 0) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `学号重复: ${duplicateIds.join(", ")}`,
        });
      }

      // Check for existing students with the same name or student ID in this class
      const existingStudents = await db.student.findMany({
        where: {
          classId: input.classId,
          OR: [
            {
              name: {
                in: input.students.map(s => s.name),
              },
            },
            ...(studentIds.length > 0 ? [{
              studentId: {
                in: studentIds,
              },
            }] : []),
          ],
        },
        select: {
          name: true,
          studentId: true,
        },
      });

      if (existingStudents.length > 0) {
        const conflictNames = existingStudents.map(s => s.name);
        const conflictIds = existingStudents.map(s => s.studentId).filter(Boolean);

        let errorMessage = "";
        if (conflictNames.length > 0) {
          errorMessage += `学生姓名已存在: ${conflictNames.join(", ")}`;
        }
        if (conflictIds.length > 0) {
          if (errorMessage) errorMessage += "; ";
          errorMessage += `学号已存在: ${conflictIds.join(", ")}`;
        }

        throw new TRPCError({
          code: "BAD_REQUEST",
          message: errorMessage,
        });
      }

      // Create all students in a transaction
      const createdStudents = await db.$transaction(
        input.students.map(studentData =>
          db.student.create({
            data: {
              name: studentData.name,
              studentId: studentData.studentId,
              className: classExists.name,
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
          })
        )
      );

      return {
        success: true,
        studentsAdded: createdStudents.length,
        students: createdStudents,
        message: `成功添加 ${createdStudents.length} 名学生到班级 "${classExists.name}"`,
      };
    } catch (error) {
      if (error instanceof TRPCError) {
        throw error;
      }

      console.error("Batch add students error:", error);
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "批量添加学生失败",
      });
    }
  });
