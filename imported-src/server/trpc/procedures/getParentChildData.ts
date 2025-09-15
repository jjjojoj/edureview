import { z } from "zod";
import { TRPCError } from "@trpc/server";
import jwt from "jsonwebtoken";
import { db } from "~/server/db";
import { baseProcedure } from "~/server/trpc/main";
import { env } from "~/server/env";

export const getParentChildData = baseProcedure
  .input(z.object({
    authToken: z.string(),
    childId: z.number(),
  }))
  .query(async ({ input }) => {
    try {
      // Verify parent authentication
      const verified = jwt.verify(input.authToken, env.JWT_SECRET);
      const parsed = z.object({ parentId: z.number() }).parse(verified);

      // Verify the child belongs to this parent
      const child = await db.student.findUnique({
        where: { id: input.childId },
        include: {
          parent: true,
          class: {
            select: {
              name: true,
              teacher: {
                select: {
                  name: true,
                  email: true,
                },
              },
            },
          },
          assignments: {
            include: {
              analysis: true,
              mistakes: {
                include: {
                  knowledgeArea: true,
                },
              },
            },
            orderBy: {
              createdAt: "desc",
            },
          },
          exams: {
            include: {
              mistakes: {
                include: {
                  knowledgeArea: true,
                },
              },
            },
            orderBy: {
              date: "desc",
            },
          },
          knowledgeAreas: {
            include: {
              knowledgeArea: true,
            },
            orderBy: {
              proficiency: "asc", // Show areas needing most improvement first
            },
          },
          mistakes: {
            include: {
              knowledgeArea: true,
            },
            orderBy: {
              createdAt: "desc",
            },
            take: 10, // Most recent mistakes
          },
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
          message: "You can only access your own child's data",
        });
      }

      // Calculate statistics
      const totalAssignments = child.assignments.length;
      const analyzedAssignments = child.assignments.filter(a => a.analysis).length;
      const totalMistakes = child.mistakes.length;
      const averageScore = child.exams.length > 0 
        ? child.exams.reduce((sum, exam) => sum + (exam.score || 0), 0) / child.exams.length
        : null;

      // Group mistakes by knowledge area
      const mistakesByArea = child.mistakes.reduce((acc, mistake) => {
        if (mistake.knowledgeArea) {
          const areaName = mistake.knowledgeArea.name;
          if (!acc[areaName]) {
            acc[areaName] = [];
          }
          acc[areaName].push(mistake);
        }
        return acc;
      }, {} as Record<string, typeof child.mistakes>);

      return {
        child: {
          id: child.id,
          name: child.name,
          schoolName: child.schoolName,
          grade: child.grade,
          class: {
            name: child.class.name,
            teacher: child.class.teacher,
          },
        },
        statistics: {
          totalAssignments,
          analyzedAssignments,
          totalMistakes,
          averageScore,
          analysisRate: totalAssignments > 0 ? (analyzedAssignments / totalAssignments) * 100 : 0,
        },
        assignments: child.assignments.map(assignment => ({
          id: assignment.id,
          title: assignment.title,
          description: assignment.description,
          imageUrl: assignment.imageUrl,
          uploadedBy: assignment.uploadedBy,
          createdAt: assignment.createdAt,
          analysis: assignment.analysis ? {
            grade: assignment.analysis.grade,
            feedback: assignment.analysis.feedback,
            strengths: assignment.analysis.strengths,
            improvements: assignment.analysis.improvements,
          } : null,
          mistakesCount: assignment.mistakes.length,
        })),
        exams: child.exams.map(exam => ({
          id: exam.id,
          title: exam.title,
          score: exam.score,
          maxScore: exam.maxScore,
          date: exam.date,
          mistakesCount: exam.mistakes.length,
        })),
        knowledgeAreas: child.knowledgeAreas.map(ka => ({
          id: ka.knowledgeArea.id,
          name: ka.knowledgeArea.name,
          description: ka.knowledgeArea.description,
          proficiency: ka.proficiency,
          lastUpdated: ka.lastUpdated,
        })),
        recentMistakes: child.mistakes.map(mistake => ({
          id: mistake.id,
          description: mistake.description,
          frequency: mistake.frequency,
          createdAt: mistake.createdAt,
          knowledgeArea: mistake.knowledgeArea?.name,
        })),
        mistakesByArea,
      };
    } catch (error) {
      if (error instanceof TRPCError) {
        throw error;
      }
      
      console.error("Get parent child data error:", error);
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to retrieve child data",
      });
    }
  });
