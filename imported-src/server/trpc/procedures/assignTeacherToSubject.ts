import { z } from "zod";
import { TRPCError } from "@trpc/server";
import jwt from "jsonwebtoken";
import { db } from "~/server/db";
import { baseProcedure } from "~/server/trpc/main";
import { env } from "~/server/env";

export const assignTeacherToSubject = baseProcedure
  .input(z.object({ 
    authToken: z.string(),
    teacherId: z.number(),
    knowledgeAreaIds: z.array(z.number()),
  }))
  .mutation(async ({ input }) => {
    try {
      // Verify teacher authentication (for now, any teacher can assign subjects)
      const verified = jwt.verify(input.authToken, env.JWT_SECRET);
      const parsed = z.object({ teacherId: z.number() }).parse(verified);

      // For now, teachers can only assign subjects to themselves
      // In a real system, you might want to add admin role checking
      if (input.teacherId !== parsed.teacherId) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You can only assign subjects to yourself",
        });
      }

      // Verify the teacher exists
      const teacher = await db.teacher.findUnique({
        where: { id: input.teacherId },
      });

      if (!teacher) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Teacher not found",
        });
      }

      // Verify all knowledge areas exist
      const knowledgeAreas = await db.knowledgeArea.findMany({
        where: {
          id: {
            in: input.knowledgeAreaIds,
          },
        },
      });

      if (knowledgeAreas.length !== input.knowledgeAreaIds.length) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "One or more knowledge areas not found",
        });
      }

      // Remove existing assignments and create new ones
      await db.$transaction(async (tx) => {
        // Remove existing assignments
        await tx.teacherKnowledgeArea.deleteMany({
          where: {
            teacherId: input.teacherId,
          },
        });

        // Create new assignments
        if (input.knowledgeAreaIds.length > 0) {
          await tx.teacherKnowledgeArea.createMany({
            data: input.knowledgeAreaIds.map(knowledgeAreaId => ({
              teacherId: input.teacherId,
              knowledgeAreaId,
            })),
          });
        }
      });

      // Return updated teacher with subjects
      const updatedTeacher = await db.teacher.findUnique({
        where: { id: input.teacherId },
        include: {
          knowledgeAreas: {
            include: {
              knowledgeArea: {
                select: {
                  id: true,
                  name: true,
                  description: true,
                },
              },
            },
          },
        },
      });

      return {
        success: true,
        teacher: updatedTeacher,
        assignedSubjects: updatedTeacher?.knowledgeAreas.map(tka => tka.knowledgeArea) || [],
      };
    } catch (error) {
      if (error instanceof TRPCError) {
        throw error;
      }
      
      console.error("Assign teacher to subject error:", error);
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to assign teacher to subjects",
      });
    }
  });
