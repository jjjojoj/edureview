import { z } from "zod";
import { TRPCError } from "@trpc/server";
import jwt from "jsonwebtoken";
import { db } from "~/server/db";
import { baseProcedure } from "~/server/trpc/main";
import { env } from "~/server/env";

export const addStudentToClass = baseProcedure
  .input(z.object({ 
    authToken: z.string(),
    classId: z.number(),
    name: z.string().min(1),
    studentId: z.string().optional(),
    email: z.string().email().optional(),
    schoolName: z.string().min(1),
    grade: z.string().min(1),
  }))
  .mutation(async ({ input }) => {
    try {
      // Verify teacher authentication
      const verified = jwt.verify(input.authToken, env.JWT_SECRET);
      const parsed = z.object({ teacherId: z.number() }).parse(verified);

      // Verify the class belongs to the teacher
      const classRecord = await db.class.findFirst({
        where: {
          id: input.classId,
          teacherId: parsed.teacherId,
        },
      });

      if (!classRecord) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Class not found or access denied",
        });
      }

      // Check if student with same email already exists in the class
      if (input.email) {
        const existingStudent = await db.student.findFirst({
          where: {
            classId: input.classId,
            email: input.email,
          },
        });

        if (existingStudent) {
          throw new TRPCError({
            code: "CONFLICT",
            message: "A student with this email already exists in the class",
          });
        }
      }

      // Create the student
      const student = await db.student.create({
        data: {
          name: input.name,
          studentId: input.studentId,
          email: input.email,
          schoolName: input.schoolName,
          grade: input.grade,
          classId: input.classId,
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
