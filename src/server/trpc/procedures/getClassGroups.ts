import { z } from "zod";
import { TRPCError } from "@trpc/server";
import jwt from "jsonwebtoken";
import { db } from "~/server/db";
import { baseProcedure } from "~/server/trpc/main";
import { env } from "~/server/env";

export const getClassGroups = baseProcedure
  .input(z.object({
    authToken: z.string(),
    classId: z.number(),
  }))
  .query(async ({ input }) => {
    try {
      // Verify teacher authentication
      const verified = jwt.verify(input.authToken, env.JWT_SECRET);
      const parsed = z.object({ teacherId: z.number() }).parse(verified);

      // Verify that the class belongs to the teacher
      const classExists = await db.class.findFirst({
        where: {
          id: input.classId,
          teacherId: parsed.teacherId,
        },
      });

      if (!classExists) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Class not found or you don't have permission to access it",
        });
      }

      // Get all groups for the class
      const groups = await db.studentGroup.findMany({
        where: {
          classId: input.classId,
        },
        include: {
          students: {
            select: {
              id: true,
              name: true,
              studentId: true,
            },
          },
          _count: {
            select: {
              students: true,
            },
          },
        },
        orderBy: {
          createdAt: 'asc',
        },
      });

      return {
        success: true,
        groups,
      };
    } catch (error) {
      if (error instanceof TRPCError) {
        throw error;
      }

      console.error('Get class groups error:', error);
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to get class groups",
      });
    }
  });