import { z } from "zod";
import { TRPCError } from "@trpc/server";
import jwt from "jsonwebtoken";
import { db } from "~/server/db";
import { baseProcedure } from "~/server/trpc/main";
import { env } from "~/server/env";

export const getTeacherClasses = baseProcedure
  .input(z.object({ 
    authToken: z.string(),
  }))
  .query(async ({ input }) => {
    try {
      // Verify teacher authentication
      const verified = jwt.verify(input.authToken, env.JWT_SECRET);
      const parsed = z.object({ teacherId: z.number() }).parse(verified);

      // Get teacher's classes with counts
      const classes = await db.class.findMany({
        where: {
          teacherId: parsed.teacherId,
        },
        include: {
          _count: {
            select: {
              students: true,
              assignments: true,
              exams: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      return {
        classes,
      };
    } catch (error) {
      throw new TRPCError({
        code: "UNAUTHORIZED",
        message: "Invalid or expired token",
      });
    }
  });
