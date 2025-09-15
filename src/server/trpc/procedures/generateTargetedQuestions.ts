import { z } from "zod";
import { TRPCError } from "@trpc/server";
import jwt from "jsonwebtoken";
import { db } from "~/server/db";
import { baseProcedure } from "~/server/trpc/main";
import { env } from "~/server/env";
import { generateTargetedQuestions, type AIModelKey } from "~/server/ai-service";

export const generateTargetedQuestionsProcedure = baseProcedure
  .input(z.object({
    authToken: z.string(),
    studentId: z.number(),
    knowledgeAreaIds: z.array(z.number()).optional(), // Optional filter by specific knowledge areas
    questionCount: z.number().min(1).max(20).default(5), // Number of questions to generate
    difficultyLevel: z.enum(["easy", "medium", "hard"]).default("medium"),
    modelKey: z.string().optional(),
  }))
  .mutation(async ({ input }) => {
    try {
      // Verify teacher authentication
      const verified = jwt.verify(input.authToken, env.JWT_SECRET);
      const parsed = z.object({ teacherId: z.number() }).parse(verified);

      // Verify the student belongs to one of the teacher's classes
      const student = await db.student.findFirst({
        where: {
          id: input.studentId,
          class: {
            teacherId: parsed.teacherId,
          },
        },
        include: {
          class: true,
        },
      });

      if (!student) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Student not found or not in your classes",
        });
      }

      // Get the student's recent mistakes
      const recentMistakes = await db.mistake.findMany({
        where: {
          studentId: input.studentId,
          ...(input.knowledgeAreaIds && input.knowledgeAreaIds.length > 0
            ? { knowledgeAreaId: { in: input.knowledgeAreaIds } }
            : {}),
        },
        include: {
          knowledgeArea: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: 10, // Get recent mistakes for context
      });

      const examMistakes = await db.examMistake.findMany({
        where: {
          studentId: input.studentId,
          ...(input.knowledgeAreaIds && input.knowledgeAreaIds.length > 0
            ? { knowledgeAreaId: { in: input.knowledgeAreaIds } }
            : {}),
        },
        include: {
          knowledgeArea: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: 10,
      });

      // Combine all mistakes
      const allMistakes = [...recentMistakes, ...examMistakes];

      if (allMistakes.length === 0) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "No mistakes found for this student in the specified knowledge areas",
        });
      }

      // Get knowledge areas from mistakes
      const knowledgeAreaIds = Array.from(
        new Set(allMistakes.map(m => m.knowledgeAreaId).filter(Boolean))
      ) as number[];

      // Get relevant teaching materials from the teacher's knowledge base
      const teachingMaterials = await db.teachingMaterial.findMany({
        where: {
          teacherId: parsed.teacherId,
          knowledgeAreaId: { in: knowledgeAreaIds },
        },
        include: {
          knowledgeArea: true,
        },
        orderBy: {
          updatedAt: 'desc',
        },
      });

      // Use specified model or default
      const modelKey = (input.modelKey as AIModelKey) || 'siliconcloud/qwen2.5-vl-7b';

      // Generate targeted questions using AI
      const questions = await generateTargetedQuestions({
        mistakes: allMistakes,
        teachingMaterials,
        studentName: student.name,
        questionCount: input.questionCount,
        difficultyLevel: input.difficultyLevel,
        modelKey,
      });

      return {
        success: true,
        questions,
        mistakesAnalyzed: allMistakes.length,
        materialsUsed: teachingMaterials.length,
        modelUsed: modelKey,
        studentName: student.name,
      };
    } catch (error) {
      console.error("Generate targeted questions error:", error);
      
      if (error instanceof TRPCError) {
        throw error;
      }

      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to generate targeted questions",
      });
    }
  });
