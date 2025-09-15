import { z } from "zod";
import { TRPCError } from "@trpc/server";
import bcryptjs from "bcryptjs";
import jwt from "jsonwebtoken";
import { db } from "~/server/db";
import { baseProcedure } from "~/server/trpc/main";
import { env } from "~/server/env";

export const loginParent = baseProcedure
  .input(z.object({ 
    phoneNumber: z.string().min(10, "Please enter a valid phone number"),
    password: z.string(),
  }))
  .mutation(async ({ input }) => {
    // Find the parent with their children
    const parent = await db.parent.findUnique({
      where: {
        phoneNumber: input.phoneNumber,
      },
      include: {
        children: {
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
    
    if (!parent) {
      throw new TRPCError({
        code: "UNAUTHORIZED",
        message: "Invalid phone number or password",
      });
    }

    // Verify the password
    const isValidPassword = await bcryptjs.compare(input.password, parent.password);
    
    if (!isValidPassword) {
      throw new TRPCError({
        code: "UNAUTHORIZED",
        message: "Invalid phone number or password",
      });
    }

    // Generate JWT token
    const authToken = jwt.sign(
      { parentId: parent.id },
      env.JWT_SECRET,
      { expiresIn: "30d" }
    );

    return {
      success: true,
      authToken,
      parent: {
        id: parent.id,
        phoneNumber: parent.phoneNumber,
        name: parent.name,
        children: parent.children.map(child => ({
          id: child.id,
          name: child.name,
          schoolName: child.schoolName,
          grade: child.grade,
          className: child.class.name,
        })),
      },
    };
  });
