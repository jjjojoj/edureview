import { z } from "zod";
import { TRPCError } from "@trpc/server";
import bcryptjs from "bcryptjs";
import jwt from "jsonwebtoken";
import { db } from "~/server/db";
import { baseProcedure } from "~/server/trpc/main";
import { env } from "~/server/env";

const phoneRegex = /^1[3-9]\d{9}$/;

export const loginTeacher = baseProcedure
  .input(z.object({ 
    phoneNumber: z.string().regex(phoneRegex, "请输入有效的手机号码"),
    password: z.string(),
  }))
  .mutation(async ({ input }) => {
    try {
      // Find the teacher
      const teacher = await db.teacher.findUnique({
        where: {
          phoneNumber: input.phoneNumber,
        },
      });
      
      if (!teacher) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "手机号码或密码无效",
        });
      }

      // Verify the password
      const isValidPassword = await bcryptjs.compare(input.password, teacher.password);
      
      if (!isValidPassword) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "手机号码或密码无效",
        });
      }

      // Generate JWT token
      const authToken = jwt.sign(
        { teacherId: teacher.id },
        env.JWT_SECRET,
        { expiresIn: "7d" }
      );

      return {
        success: true,
        authToken,
        teacher: {
          id: teacher.id,
          phoneNumber: teacher.phoneNumber,
          name: teacher.name,
        },
      };
    } catch (error) {
      if (error instanceof TRPCError) throw error;
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "登录失败，请稍后重试",
      });
    }
  });
