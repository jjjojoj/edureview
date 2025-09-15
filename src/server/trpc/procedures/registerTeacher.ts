import { z } from "zod";
import { TRPCError } from "@trpc/server";
import bcryptjs from "bcryptjs";
import { db } from "~/server/db";
import { baseProcedure } from "~/server/trpc/main";

export const registerTeacher = baseProcedure
  .input(z.object({ 
    phoneNumber: z.string().min(10, "Please enter a valid phone number"),
    name: z.string().min(1),
    password: z.string()
      .min(8, "Password must be at least 8 characters")
      .regex(/^[A-Za-z0-9]+$/, "Password must not contain special characters")
      .regex(/(?=.*[a-z])/, "Password must contain at least one lowercase letter")
      .regex(/(?=.*[A-Z])/, "Password must contain at least one uppercase letter")
      .regex(/(?=.*\d)/, "Password must contain at least one number"),
  }).refine((data) => !data.password.toLowerCase().includes(data.name.toLowerCase()), {
    message: "Password must not contain your name",
    path: ["password"],
  }))
  .mutation(async ({ input }) => {
    // Check if teacher already exists
    const existingTeacher = await db.teacher.findUnique({
      where: {
        phoneNumber: input.phoneNumber,
      },
    });
    
    if (existingTeacher) {
      throw new TRPCError({
        code: "CONFLICT",
        message: "A teacher with this phone number already exists",
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
  });
