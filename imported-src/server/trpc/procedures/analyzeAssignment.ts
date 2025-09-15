import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { analyzeAssignment, type AIModelKey } from "~/server/ai-service";
import { db } from "~/server/db";
import { baseProcedure } from "~/server/trpc/main";
import { env } from "~/server/env";
import jwt from "jsonwebtoken";

export const analyzeAssignmentProcedure = baseProcedure
  .input(z.object({
    authToken: z.string(),
    assignmentId: z.number(),
    imageUrl: z.string(),
    modelKey: z.string().optional(),
  }))
  .mutation(async ({ input }) => {
    try {
      // Verify parent authentication
      const verified = jwt.verify(input.authToken, env.JWT_SECRET);
      const parsed = z.object({ parentId: z.number() }).parse(verified);

      // Get the assignment and verify parent has access to it
      const assignment = await db.assignment.findUnique({
        where: { id: input.assignmentId },
        include: {
          student: {
            include: {
              parent: true,
            },
          },
        },
      });

      if (!assignment) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Assignment not found",
        });
      }

      if (assignment.student.parent?.id !== parsed.parentId) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You can only analyze your own child's assignments",
        });
      }

      // Fetch the image data
      const imageResponse = await fetch(input.imageUrl);
      if (!imageResponse.ok) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Could not fetch assignment image",
        });
      }

      const imageBuffer = Buffer.from(await imageResponse.arrayBuffer());

      // Use specified model or default
      const modelKey = (input.modelKey as AIModelKey) || 'siliconcloud/qwen2.5-vl-7b';
      
      // Analyze the assignment with AI
      const result = await analyzeAssignment(imageBuffer, modelKey);

      // Store the analysis in the database
      const analysis = await db.$transaction(async (tx) => {
        // Create the assignment analysis
        const assignmentAnalysis = await tx.assignmentAnalysis.create({
          data: {
            assignmentId: input.assignmentId,
            grade: result.grade,
            feedback: result.feedback,
            strengths: result.strengths,
            improvements: result.improvements,
          },
        });

        // Process mistakes and knowledge areas
        for (const mistake of result.mistakes) {
          // Find or create knowledge area
          let knowledgeArea = await tx.knowledgeArea.findUnique({
            where: { name: mistake.knowledgeArea },
          });

          if (!knowledgeArea) {
            knowledgeArea = await tx.knowledgeArea.create({
              data: {
                name: mistake.knowledgeArea,
                description: `Knowledge area: ${mistake.knowledgeArea}`,
              },
            });
          }

          // Create the mistake
          await tx.mistake.create({
            data: {
              description: mistake.description,
              studentId: assignment.studentId,
              assignmentId: input.assignmentId,
              knowledgeAreaId: knowledgeArea.id,
            },
          });

          // Update or create student knowledge area proficiency
          const existingProficiency = await tx.studentKnowledgeArea.findUnique({
            where: {
              studentId_knowledgeAreaId: {
                studentId: assignment.studentId,
                knowledgeAreaId: knowledgeArea.id,
              },
            },
          });

          if (existingProficiency) {
            // Decrease proficiency slightly when mistakes are found
            await tx.studentKnowledgeArea.update({
              where: { id: existingProficiency.id },
              data: {
                proficiency: Math.max(0, existingProficiency.proficiency - 0.1),
                lastUpdated: new Date(),
              },
            });
          } else {
            // Create new proficiency record starting at 0.5 (neutral)
            await tx.studentKnowledgeArea.create({
              data: {
                studentId: assignment.studentId,
                knowledgeAreaId: knowledgeArea.id,
                proficiency: 0.4, // Start slightly below neutral due to mistake
              },
            });
          }
        }

        return assignmentAnalysis;
      });

      return {
        success: true,
        analysis: {
          id: analysis.id,
          grade: analysis.grade,
          feedback: analysis.feedback,
          strengths: analysis.strengths,
          improvements: analysis.improvements,
        },
        mistakesCount: result.mistakes.length,
        modelUsed: modelKey,
      };
    } catch (error) {
      console.error("Assignment analysis error:", error);
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to analyze assignment",
      });
    }
  });
