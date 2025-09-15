import { z } from "zod";
import { TRPCError } from "@trpc/server";
import jwt from "jsonwebtoken";
import { db } from "~/server/db";
import { baseProcedure } from "~/server/trpc/main";
import { env } from "~/server/env";

export const uploadTeacherAssignment = baseProcedure
  .input(z.object({
    authToken: z.string(),
    studentId: z.number(),
    title: z.string().optional(),
    description: z.string().optional(),
    imageUrl: z.string(),
  }))
  .mutation(async ({ input }) => {
    try {
      // Verify teacher authentication
      const verified = jwt.verify(input.authToken, env.JWT_SECRET);
      const parsed = z.object({ teacherId: z.number() }).parse(verified);

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

      if (student.class.teacher.id !== parsed.teacherId) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You can only upload assignments for students in your classes",
        });
      }

      // Generate default title if not provided
      const finalTitle = input.title && input.title.trim() 
        ? input.title 
        : `作业 - ${new Date().toLocaleDateString('zh-CN', { 
            year: 'numeric', 
            month: '2-digit', 
            day: '2-digit' 
          })}`;

      // Create the assignment record
      const assignment = await db.assignment.create({
        data: {
          title: finalTitle,
          description: input.description,
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
        assignment: {
          id: assignment.id,
          title: assignment.title,
          description: assignment.description,
          imageUrl: assignment.imageUrl,
          createdAt: assignment.createdAt,
          student: {
            name: assignment.student.name,
            className: assignment.student.class.name,
          },
        },
      };
    } catch (error) {
      if (error instanceof TRPCError) {
        throw error;
      }
      
      console.error("Upload teacher assignment error:", error);
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to upload assignment",
      });
    }
  });
