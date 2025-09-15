import { z } from "zod";
import { TRPCError } from "@trpc/server";
import jwt from "jsonwebtoken";
import { db } from "~/server/db";
import { baseProcedure } from "~/server/trpc/main";
import { env } from "~/server/env";

export const getTeacherSubjects = baseProcedure
  .input(z.object({ 
    authToken: z.string(),
  }))
  .query(async ({ input }) => {
    try {
      // Verify teacher authentication
      const verified = jwt.verify(input.authToken, env.JWT_SECRET);
      const parsed = z.object({ teacherId: z.number() }).parse(verified);

      // Get teacher with their knowledge areas and related student data
      const teacher = await db.teacher.findUnique({
        where: { id: parsed.teacherId },
        include: {
          knowledgeAreas: {
            include: {
              knowledgeArea: {
                include: {
                  students: {
                    include: {
                      student: {
                        include: {
                          class: {
                            select: {
                              name: true,
                            },
                          },
                          mistakes: {
                            where: {
                              knowledgeAreaId: {
                                not: null,
                              },
                            },
                            include: {
                              knowledgeArea: true,
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
                          },
                        },
                      },
                    },
                  },
                  mistakes: {
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
                  },
                },
              },
            },
          },
        },
      });

      if (!teacher) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Teacher not found",
        });
      }

      // Process the data to provide subject-specific insights
      const subjects = teacher.knowledgeAreas.map((tka) => {
        const knowledgeArea = tka.knowledgeArea;
        const students = knowledgeArea.students;
        const mistakes = knowledgeArea.mistakes;

        // Calculate statistics
        const totalStudents = students.length;
        const averageProficiency = students.length > 0 
          ? students.reduce((sum, s) => sum + s.proficiency, 0) / students.length
          : 0;

        // Group mistakes by frequency to find common problem areas
        const commonMistakes = mistakes
          .reduce((acc, mistake) => {
            const key = mistake.description;
            if (!acc[key]) {
              acc[key] = {
                description: mistake.description,
                count: 0,
                students: new Set(),
              };
            }
            acc[key].count += mistake.frequency;
            acc[key].students.add(mistake.student.id);
            return acc;
          }, {} as Record<string, { description: string; count: number; students: Set<number> }>);

        const topMistakes = Object.values(commonMistakes)
          .map(m => ({
            description: m.description,
            count: m.count,
            affectedStudents: m.students.size,
          }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 5);

        // Calculate improvement trends (students who need attention)
        const studentsNeedingAttention = students
          .filter(s => s.proficiency < 0.6)
          .map(s => ({
            id: s.student.id,
            name: s.student.name,
            className: s.student.class.name,
            proficiency: s.proficiency,
            recentMistakes: s.student.mistakes.filter(m => 
              m.knowledgeAreaId === knowledgeArea.id
            ).length,
          }))
          .sort((a, b) => a.proficiency - b.proficiency);

        return {
          id: knowledgeArea.id,
          name: knowledgeArea.name,
          description: knowledgeArea.description,
          statistics: {
            totalStudents,
            averageProficiency: Math.round(averageProficiency * 100),
            studentsNeedingAttention: studentsNeedingAttention.length,
            totalMistakes: mistakes.length,
          },
          topMistakes,
          studentsNeedingAttention,
          assignedAt: tka.createdAt,
        };
      });

      return {
        teacher: {
          id: teacher.id,
          name: teacher.name,
          phoneNumber: teacher.phoneNumber,
        },
        subjects,
        totalSubjects: subjects.length,
        totalStudentsAcrossSubjects: [...new Set(
          subjects.flatMap(s => s.studentsNeedingAttention.map(student => student.id))
        )].length,
      };
    } catch (error) {
      if (error instanceof TRPCError) {
        throw error;
      }
      
      console.error("Get teacher subjects error:", error);
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to retrieve teacher subjects",
      });
    }
  });
