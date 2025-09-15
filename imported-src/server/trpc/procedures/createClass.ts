import { z } from "zod";
import { TRPCError } from "@trpc/server";
import jwt from "jsonwebtoken";
import { db } from "~/server/db";
import { baseProcedure } from "~/server/trpc/main";
import { env } from "~/server/env";

// Helper function to generate 6-digit invitation code
function generateInvitationCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Helper function to generate unique invitation code
async function generateUniqueInvitationCode(): Promise<string> {
  let code: string;
  let isUnique = false;
  
  do {
    code = generateInvitationCode();
    const existingClass = await db.class.findFirst({
      where: {
        invitationCode: code,
        invitationCodeExpiresAt: {
          gt: new Date(), // Only check non-expired codes
        },
      },
    });
    isUnique = !existingClass;
  } while (!isUnique);
  
  return code;
}

export const createClass = baseProcedure
  .input(z.object({ 
    authToken: z.string(),
    name: z.string().min(1),
    description: z.string().optional(),
  }))
  .mutation(async ({ input }) => {
    try {
      // Verify teacher authentication
      const verified = jwt.verify(input.authToken, env.JWT_SECRET);
      const parsed = z.object({ teacherId: z.number() }).parse(verified);

      // Generate unique invitation code
      const invitationCode = await generateUniqueInvitationCode();
      const invitationCodeExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours from now

      // Create the class
      const newClass = await db.class.create({
        data: {
          name: input.name,
          description: input.description,
          teacherId: parsed.teacherId,
          invitationCode,
          invitationCodeExpiresAt,
        },
        include: {
          teacher: {
            select: {
              id: true,
              name: true,
              phoneNumber: true,
            },
          },
          _count: {
            select: {
              students: true,
            },
          },
        },
      });

      return {
        success: true,
        class: {
          ...newClass,
          invitationCode: newClass.invitationCode,
          invitationCodeExpiresAt: newClass.invitationCodeExpiresAt,
        },
      };
    } catch (error) {
      throw new TRPCError({
        code: "UNAUTHORIZED",
        message: "Invalid or expired token",
      });
    }
  });
