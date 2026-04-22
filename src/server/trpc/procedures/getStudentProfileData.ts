import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { db } from "~/server/db";
import { authedProcedure } from "~/server/trpc/main";

export const getStudentProfileData = authedProcedure
  .input(z.object({ 
    studentId: z.number(),
  }))
  .query(async ({ input, ctx }) => {
    try {
      // Get the student and verify the teacher has access
      const student = await db.student.findFirst({
        where: {
          id: input.studentId,
          class: {
            teacherId: ctx.auth.teacherId,
          },
        },
        include: {
          class: true,
          assignments: {
            include: {
              analysis: {
                include: {
                  mistakes: {
                    include: {
                      knowledgeArea: true,
                    },
                  },
                },
              },
            },
            orderBy: {
              createdAt: 'desc',
            },
          },
          exams: {
            include: {
              analysis: {
                include: {
                  mistakes: {
                    include: {
                      knowledgeArea: true,
                    },
                  },
                },
              },
            },
            orderBy: {
              createdAt: 'desc',
            },
          },
          mistakes: {
            include: {
              knowledgeArea: true,
              analysis: true,
            },
            orderBy: {
              createdAt: 'desc',
            },
          },
          examMistakes: {
            include: {
              knowledgeArea: true,
              analysis: true,
            },
            orderBy: {
              createdAt: 'desc',
            },
          },
          studentKnowledgeAreas: {
            include: {
              knowledgeArea: true,
            },
          },
        },
      });

      if (!student) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Student not found or you don't have permission to view their profile",
        });
      }

      // Calculate statistics
      const totalMistakes = student.mistakes.length + student.examMistakes.length;
      
      // Group mistakes by knowledge area
      const mistakesByKnowledgeArea = new Map<string, number>();
      [...student.mistakes, ...student.examMistakes].forEach(mistake => {
        if (mistake.knowledgeArea) {
          const current = mistakesByKnowledgeArea.get(mistake.knowledgeArea.name) || 0;
          mistakesByKnowledgeArea.set(mistake.knowledgeArea.name, current + 1);
        }
      });

      // Calculate average proficiency level
      const proficiencyLevels = student.studentKnowledgeAreas
        .filter(ska => ska.proficiencyLevel)
        .map(ska => {
          switch (ska.proficiencyLevel) {
            case 'beginner': return 1;
            case 'intermediate': return 2;
            case 'advanced': return 3;
            default: return 1;
          }
        });
      
      const averageProficiency = proficiencyLevels.length > 0 
        ? proficiencyLevels.reduce((sum, level) => sum + level, 0) / proficiencyLevels.length
        : 0;

      return {
        student,
        statistics: {
          totalAssignments: student.assignments.length,
          totalExams: student.exams.length,
          totalMistakes,
          averageProficiency,
          mistakesByKnowledgeArea: Array.from(mistakesByKnowledgeArea.entries()).map(([name, count]) => ({
            name,
            count,
          })),
        },
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
