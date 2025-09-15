import { z } from "zod";
import { TRPCError } from "@trpc/server";
import bcryptjs from "bcryptjs";
import jwt from "jsonwebtoken";
import { db } from "~/server/db";
import { baseProcedure } from "~/server/trpc/main";
import { env } from "~/server/env";

export const loginTeacher = baseProcedure
  .input(z.object({ 
    phoneNumber: z.string().min(10, "Please enter a valid phone number"),
    password: z.string(),
  }))
  .mutation(async ({ input }) => {
    // Find the teacher
    const teacher = await db.teacher.findUnique({
      where: {
        phoneNumber: input.phoneNumber,
      },
    });
    
    if (!teacher) {
      throw new TRPCError({
        code: "UNAUTHORIZED",
        message: "Invalid phone number or password",
      });
    }

    // Verify the password
    const isValidPassword = await bcryptjs.compare(input.password, teacher.password);
    
    if (!isValidPassword) {
      throw new TRPCError({
        code: "UNAUTHORIZED",
        message: "Invalid phone number or password",
      });
    }

    // Generate JWT token
    const authToken = jwt.sign(
      { teacherId: teacher.id },
      env.JWT_SECRET,
      { expiresIn: "30d" }
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
  });
