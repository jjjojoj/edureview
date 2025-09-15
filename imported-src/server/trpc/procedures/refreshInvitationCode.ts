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

export const refreshInvitationCode = baseProcedure
  .input(z.object({ 
    authToken: z.string(),
    classId: z.number(),
  }))
  .mutation(async ({ input }) => {
    try {
      // Verify teacher authentication
      const verified = jwt.verify(input.authToken, env.JWT_SECRET);
      const parsed = z.object({ teacherId: z.number() }).parse(verified);

      // Verify the teacher owns this class
      const existingClass = await db.class.findUnique({
        where: { id: input.classId },
        include: {
          teacher: {
            select: {
              id: true,
              name: true,
              phoneNumber: true,
            },
          },
        },
      });

      if (!existingClass) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Class not found",
        });
      }

      if (existingClass.teacherId !== parsed.teacherId) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You can only refresh invitation codes for your own classes",
        });
      }

      // Generate new invitation code
      const newInvitationCode = await generateUniqueInvitationCode();
      const newInvitationCodeExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours from now

      // Update the class with new invitation code
      const updatedClass = await db.class.update({
        where: { id: input.classId },
        data: {
          invitationCode: newInvitationCode,
          invitationCodeExpiresAt: newInvitationCodeExpiresAt,
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
        class: updatedClass,
        newInvitationCode,
        expiresAt: newInvitationCodeExpiresAt,
      };
    } catch (error) {
      if (error instanceof TRPCError) {
        throw error;
      }
      
      console.error("Refresh invitation code error:", error);
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to refresh invitation code",
      });
    }
  });
