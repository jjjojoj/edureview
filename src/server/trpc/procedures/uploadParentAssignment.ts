import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { db } from "~/server/db";
import { authedProcedure } from "~/server/trpc/main";

export const uploadParentAssignment = authedProcedure
  .input(z.object({
    childId: z.number(),
    title: z.string().min(1),
    description: z.string().optional(),
    imageUrl: z.string(),
  }))
  .mutation(async ({ input, ctx }) => {
    try {
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

      if (child.parent?.id !== ctx.auth.parentId) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You can only upload assignments for your own child",
        });
      }

      // Create the assignment record
      const assignment = await db.assignment.create({
        data: {
          title: input.title,
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
          imageUrl: assignment.imageUrl,
          createdAt: assignment.createdAt,
          student: {
            name: assignment.student?.name ?? '',
            className: assignment.student?.class?.name ?? '',
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
