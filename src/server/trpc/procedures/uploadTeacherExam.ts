import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { db } from "~/server/db";
import { authedProcedure } from "~/server/trpc/main";

export const uploadTeacherExam = authedProcedure
  .input(z.object({
    studentId: z.number(),
    title: z.string().min(1),
    description: z.string().optional(),
    imageUrl: z.string(),
  }))
  .mutation(async ({ input, ctx }) => {
    try {
      // Verify the student exists and the teacher has access to the class
      const student = await db.student.findUnique({
        where: { id: input.studentId },
        include: {
          class: {
            include: {
              teacher: true,
            },
          },
        },
      });

      if (!student) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Student not found",
        });
      }

      if (!student.class || student.class.teacher.id !== ctx.auth.teacherId) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You can only upload exams for students in your classes",
        });
      }

      // Create the exam record
      const exam = await db.exam.create({
        data: {
          title: input.title,
          imageUrl: input.imageUrl,
          uploadedBy: "teacher",
          studentId: input.studentId,
          classId: student.classId,
        },
        include: {
          student: {
            include: {
              class: {
                select: {
                  name: true,
                },
              },
            },
          },
        },
      });

      return {
        success: true,
        exam: {
          id: exam.id,
          title: exam.title,
          imageUrl: exam.imageUrl,
          createdAt: exam.createdAt,
          student: {
            name: exam.student?.name ?? '',
            className: exam.student?.class?.name ?? '',
          },
        },
      };
    } catch (error) {
      if (error instanceof TRPCError) {
        throw error;
      }
      
      console.error("Upload teacher exam error:", error);
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to upload exam",
      });
    }
  });
