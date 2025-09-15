import { z } from "zod";
import { TRPCError } from "@trpc/server";
import jwt from "jsonwebtoken";
import { db } from "~/server/db";
import { baseProcedure } from "~/server/trpc/main";
import { env } from "~/server/env";

export const verifyTeacher = baseProcedure
  .input(z.object({ 
    authToken: z.string(),
  }))
  .query(async ({ input }) => {
    try {
      // Verify and parse the JWT token
      const verified = jwt.verify(input.authToken, env.JWT_SECRET);
      const parsed = z.object({ teacherId: z.number() }).parse(verified);

      // Get the teacher from database
      const teacher = await db.teacher.findUnique({
        where: {
          id: parsed.teacherId,
        },
        select: {
          id: true,
          email: true,
          name: true,
          createdAt: true,
        },
      });

      if (!teacher) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Teacher not found",
        });
      }

      return {
        teacher,
      };
    } catch (error) {
      throw new TRPCError({
        code: "UNAUTHORIZED",
        message: "Invalid or expired token",
      });
    }
  });
