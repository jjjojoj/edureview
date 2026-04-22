import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { db } from "~/server/db";
import { authedProcedure } from "~/server/trpc/main";

async function generateUniqueInvitationCode(): Promise<string> {
  let code: string;
  let isUnique = false;
  
  while (!isUnique) {
    // Generate 6-digit code
    code = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Check if code is already in use by an active (non-expired) class
    const existingClass = await db.class.findFirst({
      where: {
        invitationCode: code,
        invitationCodeExpiresAt: {
          gt: new Date(), // Only check non-expired codes
        },
      },
    });
    
    if (!existingClass) {
      isUnique = true;
      return code;
    }
  }
  
  throw new Error("Failed to generate unique invitation code");
}

export const refreshInvitationCode = authedProcedure
  .input(z.object({ 
    classId: z.number(),
  }))
  .mutation(async ({ input, ctx }) => {
    try {
      // Get the class and verify ownership
      const classData = await db.class.findFirst({
        where: {
          id: input.classId,
          teacherId: ctx.auth.teacherId,
        },
      });

      if (!classData) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Class not found or you don't have permission to modify it",
        });
      }

      // Check 24-hour cooldown period
      if (classData.lastInvitationCodeGeneratedAt) {
        const hoursSinceLastGeneration = (Date.now() - classData.lastInvitationCodeGeneratedAt.getTime()) / (1000 * 60 * 60);
        if (hoursSinceLastGeneration < 24) {
          const hoursRemaining = Math.ceil(24 - hoursSinceLastGeneration);
          throw new TRPCError({
            code: "TOO_MANY_REQUESTS",
            message: `You can only generate a new invitation code once every 24 hours. Please wait ${hoursRemaining} more hour(s).`,
          });
        }
      }

      // Generate new unique invitation code
      const newInvitationCode = await generateUniqueInvitationCode();
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours from now
      const now = new Date();

      // Update the class with new invitation code
      const updatedClass = await db.class.update({
        where: { id: input.classId },
        data: {
          invitationCode: newInvitationCode,
          invitationCodeExpiresAt: expiresAt,
          lastInvitationCodeGeneratedAt: now,
        },
      });

      return {
        success: true,
        invitationCode: updatedClass.invitationCode,
        expiresAt: updatedClass.invitationCodeExpiresAt,
        canGenerateNext: new Date(now.getTime() + 24 * 60 * 60 * 1000), // When they can generate next
      };
    } catch (error) {
      if (error instanceof TRPCError) {
        throw error;
      }
      throw new TRPCError({
        code: "UNAUTHORIZED",
        message: "Invalid or expired token",
      });
    }
  });
