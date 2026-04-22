import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { db } from "~/server/db";
import { authedProcedure } from "~/server/trpc/main";

// Helper function to generate 6-digit invitation code
function generateInvitationCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Helper function to generate unique invitation code
async function generateUniqueInvitationCode(): Promise<string> {
  let code: string;
  let isUnique = false;
  let attempts = 0;
  const maxAttempts = 10; // Prevent infinite loops
  
  do {
    code = generateInvitationCode();
    attempts++;
    
    if (attempts > maxAttempts) {
      throw new Error("Failed to generate unique invitation code after multiple attempts");
    }
    
    try {
      const existingClass = await db.class.findFirst({
        where: {
          invitationCode: code,
          invitationCodeExpiresAt: {
            gt: new Date(), // Only check non-expired codes
          },
        },
      });
      isUnique = !existingClass;
    } catch (error) {
      console.error("Database error while checking invitation code uniqueness:", error);
      throw error; // Re-throw to be handled by the calling function
    }
  } while (!isUnique);
  
  return code;
}

export const createClass = authedProcedure
  .input(z.object({ 
    name: z.string().min(1),
    description: z.string().optional(),
    initialStudentCount: z.number().min(1).max(100).optional(),
  }))
  .mutation(async ({ input, ctx }) => {
    // Then handle database operations with proper error handling
    try {
      // Generate unique invitation code
      const invitationCode = await generateUniqueInvitationCode();
      const invitationCodeExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours from now

      // Create the class
      const now = new Date();
      const newClass = await db.class.create({
        data: {
          name: input.name,
          description: input.description,
          initialStudentCount: input.initialStudentCount,
          teacherId: ctx.auth.teacherId,
          invitationCode,
          invitationCodeExpiresAt,
          lastInvitationCodeGeneratedAt: now, // Set the initial generation time
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
      console.error("Database error in createClass:", error);
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to create class. Please try again.",
      });
    }
  });
