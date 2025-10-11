import { z } from "zod";
import { TRPCError } from "@trpc/server";
import jwt from "jsonwebtoken";
import { db } from "~/server/db";
import { baseProcedure } from "~/server/trpc/main";
import { env } from "~/server/env";

export const deleteStudentFromClass = baseProcedure
  .input(z.object({
    authToken: z.string(),
    studentId: z.number(),
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
          message: "You don't have permission to delete this student",
        });
      }

      // Get the student's current studentId for inheritance logic
      const deletedStudentId = student.studentId;
      const classId = student.classId;

      // Start transaction to handle deletion and ID inheritance
      const result = await db.$transaction(async (prisma) => {
        // Delete the student first (this will cascade delete related records)
        await prisma.student.delete({
          where: {
            id: input.studentId,
          },
        });

        // If the student had a studentId, implement inheritance logic
        if (deletedStudentId) {
          // Parse the studentId to get the numeric part
          const numericMatch = deletedStudentId.match(/(\d+)/);
          if (numericMatch) {
            const deletedIdNumber = parseInt(numericMatch[1]);

            // Get all students in the class with higher student IDs
            const studentsToUpdate = await prisma.student.findMany({
              where: {
                classId: classId,
                studentId: {
                  not: null,
                },
              },
              orderBy: {
                studentId: 'asc',
              },
            });

            // Find students with higher numeric IDs and update them
            const updates: Promise<any>[] = [];

            for (const classStudent of studentsToUpdate) {
              if (!classStudent.studentId) continue;

              const studentNumericMatch = classStudent.studentId.match(/(\d+)/);
              if (studentNumericMatch) {
                const studentIdNumber = parseInt(studentNumericMatch[1]);

                if (studentIdNumber > deletedIdNumber) {
                  // Inherit the previous ID (decrease by 1)
                  const newIdNumber = studentIdNumber - 1;

                  // Preserve the original format (e.g., "001", "02", etc.)
                  let newStudentId: string;
                  if (deletedStudentId.startsWith('0')) {
                    // Handle leading zeros
                    const paddedLength = deletedStudentId.length;
                    newStudentId = newIdNumber.toString().padStart(paddedLength, '0');
                  } else {
                    newStudentId = newIdNumber.toString();
                  }

                  updates.push(
                    prisma.student.update({
                      where: { id: classStudent.id },
                      data: { studentId: newStudentId },
                    })
                  );
                }
              }
            }

            // Execute all updates
            if (updates.length > 0) {
              await Promise.all(updates);
            }
          }
        }

        return {
          success: true,
          deletedStudent: {
            id: input.studentId,
            name: student.name,
            studentId: deletedStudentId,
          },
          inheritanceApplied: !!deletedStudentId,
        };
      });

      return result;
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