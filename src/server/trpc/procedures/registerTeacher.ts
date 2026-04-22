import { z } from "zod";
import { TRPCError } from "@trpc/server";
import bcryptjs from "bcryptjs";
import { db } from "~/server/db";
import { baseProcedure } from "~/server/trpc/main";

const phoneRegex = /^1[3-9]\d{9}$/;

export const registerTeacher = baseProcedure
  .input(z.object({ 
    phoneNumber: z.string().regex(phoneRegex, "请输入有效的手机号码"),
    name: z.string().min(1, "请输入姓名"),
    password: z.string()
      .min(8, "密码至少需要8个字符")
      .regex(/(?=.*[a-z])/, "密码需要包含至少一个小写字母")
      .regex(/(?=.*[A-Z])/, "密码需要包含至少一个大写字母")
      .regex(/(?=.*\d)/, "密码需要包含至少一个数字"),
  }).refine((data) => !data.password.toLowerCase().includes(data.name.toLowerCase()), {
    message: "密码不能包含您的姓名",
    path: ["password"],
  }))
  .mutation(async ({ input }) => {
    try {
      // Check if teacher already exists
      const existingTeacher = await db.teacher.findUnique({
        where: {
          phoneNumber: input.phoneNumber,
        },
      });
      
      if (existingTeacher) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "该手机号已被注册",
        });
      }

      // Hash the password
      const hashedPassword = await bcryptjs.hash(input.password, 12);

      // Create the teacher
      const teacher = await db.teacher.create({
        data: {
          phoneNumber: input.phoneNumber,
          name: input.name,
          password: hashedPassword,
        },
        select: {
          id: true,
          phoneNumber: true,
          name: true,
          createdAt: true,
        },
      });

      return {
        success: true,
        teacher,
      };
    } catch (error) {
      if (error instanceof TRPCError) throw error;
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "注册失败，请稍后重试",
      });
    }
  });
