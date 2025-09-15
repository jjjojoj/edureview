import { z } from "zod";
import { TRPCError } from "@trpc/server";
import jwt from "jsonwebtoken";
import { db } from "~/server/db";
import { baseProcedure } from "~/server/trpc/main";
import { env } from "~/server/env";

const getUploadStatsSchema = z.object({
  authToken: z.string(),
  timeRange: z.enum(["day", "week", "month", "all"]).default("week"),
  includeAnalytics: z.boolean().default(true),
});

const getSystemStatsSchema = z.object({
  authToken: z.string(),
  adminOnly: z.boolean().default(false),
});

export const getUserUploadStatsProcedure = baseProcedure
  .input(getUploadStatsSchema)
  .query(async ({ input }) => {
    try {
      // Verify authentication (works for both parents and teachers)
      const verified = jwt.verify(input.authToken, env.JWT_SECRET);
      
      // Try to parse as parent first, then teacher
      let userId: number;
      let userType: "parent" | "teacher";
      
      try {
        const parentParsed = z.object({ parentId: z.number() }).parse(verified);
        userId = parentParsed.parentId;
        userType = "parent";
      } catch {
        const teacherParsed = z.object({ teacherId: z.number() }).parse(verified);
        userId = teacherParsed.teacherId;
        userType = "teacher";
      }

      // Calculate date range
      const now = new Date();
      let startDate: Date;
      
      switch (input.timeRange) {
        case "day":
          startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
          break;
        case "week":
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case "month":
          startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          break;
        case "all":
        default:
          startDate = new Date(0); // Beginning of time
          break;
      }

      // Build query conditions based on user type
      const whereCondition = userType === "parent" 
        ? {
            uploadedBy: "parent",
            student: {
              parent: {
                id: userId,
              },
            },
            createdAt: {
              gte: startDate,
            },
          }
        : {
            uploadedBy: "teacher",
            student: {
              class: {
                teacher: {
                  id: userId,
                },
              },
            },
            createdAt: {
              gte: startDate,
            },
          };

      // Get basic upload statistics
      const assignments = await db.assignment.findMany({
        where: whereCondition,
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
          analysis: true,
        },
        orderBy: {
          createdAt: "desc",
        },
      });

      // Calculate statistics
      const totalUploads = assignments.length;
      const analyzedCount = assignments.filter(a => a.analysis).length;
      const analysisRate = totalUploads > 0 ? (analyzedCount / totalUploads) * 100 : 0;

      // Group by date for trends
      const uploadsByDate: Record<string, number> = {};
      const analysisByDate: Record<string, number> = {};

      assignments.forEach(assignment => {
        const dateKey = assignment.createdAt.toISOString().split('T')[0];
        uploadsByDate[dateKey] = (uploadsByDate[dateKey] || 0) + 1;
        
        if (assignment.analysis) {
          analysisByDate[dateKey] = (analysisByDate[dateKey] || 0) + 1;
        }
      });

      const result = {
        summary: {
          totalUploads,
          analyzedCount,
          analysisRate: Math.round(analysisRate * 100) / 100,
          timeRange: input.timeRange,
          userType,
        },
        trends: {
          uploadsByDate,
          analysisByDate,
        },
        recentUploads: assignments.slice(0, 10).map(a => ({
          id: a.id,
          title: a.title,
          studentName: a.student.name,
          className: a.student.class.name,
          createdAt: a.createdAt,
          hasAnalysis: !!a.analysis,
        })),
      };

      // Add detailed analytics if requested
      if (input.includeAnalytics && assignments.length > 0) {
        const analyses = assignments.filter(a => a.analysis).map(a => a.analysis!);
        
        const avgGrades = analyses
          .map(a => a.grade)
          .filter(Boolean)
          .map(grade => {
            // Try to extract numeric grade
            const match = grade!.match(/(\d+(?:\.\d+)?)/);
            return match ? parseFloat(match[1]) : null;
          })
          .filter(Boolean) as number[];

        const avgGrade = avgGrades.length > 0 
          ? avgGrades.reduce((sum, grade) => sum + grade, 0) / avgGrades.length 
          : null;

        // Most common strengths and improvements
        const allStrengths = analyses.flatMap(a => a.strengths || []);
        const allImprovements = analyses.flatMap(a => a.improvements || []);

        const strengthCounts: Record<string, number> = {};
        const improvementCounts: Record<string, number> = {};

        allStrengths.forEach(strength => {
          strengthCounts[strength] = (strengthCounts[strength] || 0) + 1;
        });

        allImprovements.forEach(improvement => {
          improvementCounts[improvement] = (improvementCounts[improvement] || 0) + 1;
        });

        const topStrengths = Object.entries(strengthCounts)
          .sort(([,a], [,b]) => b - a)
          .slice(0, 5)
          .map(([strength, count]) => ({ strength, count }));

        const topImprovements = Object.entries(improvementCounts)
          .sort(([,a], [,b]) => b - a)
          .slice(0, 5)
          .map(([improvement, count]) => ({ improvement, count }));

        (result as any).analytics = {
          averageGrade: avgGrade ? Math.round(avgGrade * 100) / 100 : null,
          totalAnalyses: analyses.length,
          topStrengths,
          topImprovements,
        };
      }

      return result;
    } catch (error) {
      console.error("Get upload stats error:", error);
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to get upload statistics",
      });
    }
  });

export const getSystemStatsProcedure = baseProcedure
  .input(getSystemStatsSchema)
  .query(async ({ input }) => {
    try {
      // Verify authentication
      const verified = jwt.verify(input.authToken, env.JWT_SECRET);
      
      // For now, we'll allow teachers to see system stats
      // In a real system, you'd want admin-only access
      let isAuthorized = false;
      try {
        z.object({ teacherId: z.number() }).parse(verified);
        isAuthorized = true;
      } catch {
        try {
          z.object({ parentId: z.number() }).parse(verified);
          isAuthorized = !input.adminOnly; // Parents can see limited stats
        } catch {
          isAuthorized = false;
        }
      }

      if (!isAuthorized) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Insufficient permissions",
        });
      }

      // Get system-wide statistics
      const [
        totalAssignments,
        totalAnalyses,
        totalStudents,
        totalTeachers,
        totalParents,
        totalClasses,
      ] = await Promise.all([
        db.assignment.count(),
        db.assignmentAnalysis.count(),
        db.student.count(),
        db.teacher.count(),
        db.parent.count(),
        db.class.count(),
      ]);

      // Get upload trends for the last 30 days
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      
      const recentAssignments = await db.assignment.findMany({
        where: {
          createdAt: {
            gte: thirtyDaysAgo,
          },
        },
        select: {
          createdAt: true,
          uploadedBy: true,
          analysis: {
            select: {
              id: true,
            },
          },
        },
      });

      // Group by date and upload type
      const uploadTrends: Record<string, { parent: number; teacher: number; analyzed: number }> = {};
      
      recentAssignments.forEach(assignment => {
        const dateKey = assignment.createdAt.toISOString().split('T')[0];
        if (!uploadTrends[dateKey]) {
          uploadTrends[dateKey] = { parent: 0, teacher: 0, analyzed: 0 };
        }
        
        if (assignment.uploadedBy === 'parent') {
          uploadTrends[dateKey].parent++;
        } else {
          uploadTrends[dateKey].teacher++;
        }
        
        if (assignment.analysis) {
          uploadTrends[dateKey].analyzed++;
        }
      });

      const analysisRate = totalAssignments > 0 
        ? Math.round((totalAnalyses / totalAssignments) * 10000) / 100 
        : 0;

      return {
        summary: {
          totalAssignments,
          totalAnalyses,
          totalStudents,
          totalTeachers,
          totalParents,
          totalClasses,
          analysisRate,
        },
        trends: {
          last30Days: uploadTrends,
        },
        performance: {
          avgAnalysisTime: null, // Could be calculated if we track processing times
          successRate: analysisRate,
          activeUsers: {
            teachers: totalTeachers, // Could be more specific with recent activity
            parents: totalParents,
          },
        },
      };
    } catch (error) {
      if (error instanceof TRPCError) {
        throw error;
      }
      
      console.error("Get system stats error:", error);
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to get system statistics",
      });
    }
  });
