import { z } from "zod";
import { TRPCError } from "@trpc/server";
import jwt from "jsonwebtoken";
import { db } from "~/server/db";
import { baseProcedure } from "~/server/trpc/main";
import { env } from "~/server/env";

export const uploadParentAssignment = baseProcedure
  .input(z.object({
    authToken: z.string(),
    childId: z.number(),
    title: z.string().min(1),
    description: z.string().optional(),
    imageUrl: z.string(),
  }))
  .mutation(async ({ input }) => {
    try {
      // Verify parent authentication
      const verified = jwt.verify(input.authToken, env.JWT_SECRET);
      const parsed = z.object({ parentId: z.number() }).parse(verified);

      // Verify the child belongs to this parent
      const child = await db.student.findUnique({
        where: { id: input.childId },
        include: {
          parent: true,
          class: true,
        },
      });

      if (!child) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Child not found",
        });
      }

      if (child.parent?.id !== parsed.parentId) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You can only upload assignments for your own child",
        });
      }

      // Create the assignment record
      const assignment = await db.assignment.create({
        data: {
          title: input.title,
          description: input.description,
          imageUrl: input.imageUrl,
          uploadedBy: "parent",
          studentId: input.childId,
          classId: child.classId,
        },
        include: {
          student: {
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

      return {
        success: true,
        assignment: {
          id: assignment.id,
          title: assignment.title,
          description: assignment.description,
          imageUrl: assignment.imageUrl,
          createdAt: assignment.createdAt,
          student: {
            name: assignment.student.name,
            className: assignment.student.class.name,
          },
        },
      };
    } catch (error) {
      if (error instanceof TRPCError) {
        throw error;
      }
      
      console.error("Upload assignment error:", error);
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to upload assignment",
      });
    }
  });
