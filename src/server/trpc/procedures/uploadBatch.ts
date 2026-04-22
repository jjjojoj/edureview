import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { db } from "~/server/db";
import { authedProcedure } from "~/server/trpc/main";
import { analyzeAssignment, type AIModelKey } from "~/server/ai-service";

const batchUploadItemSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  imageUrl: z.string(),
  fileName: z.string(),
});

const batchParentUploadSchema = z.object({
  childId: z.number(),
  assignments: z.array(batchUploadItemSchema).min(1).max(10), // Limit to 10 per batch
  analyzeImmediately: z.boolean().default(true),
  modelKey: z.string().optional(),
});

const batchTeacherUploadSchema = z.object({
  assignments: z.array(batchUploadItemSchema.extend({
    studentId: z.number(),
  })).min(1).max(10), // Limit to 10 per batch
  analyzeImmediately: z.boolean().default(false), // Teachers might want to review first
});

export const batchParentUploadProcedure = authedProcedure
  .input(batchParentUploadSchema)
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

      // Process batch upload in a transaction
      const result = await db.$transaction(async (tx) => {
        const createdAssignments = [];
        const analysisPromises = [];

        for (const assignment of input.assignments) {
          // Create assignment record
          const createdAssignment = await tx.assignment.create({
            data: {
              title: assignment.title,
              imageUrl: assignment.imageUrl,
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

          createdAssignments.push({
            id: createdAssignment.id,
            title: createdAssignment.title,
            imageUrl: createdAssignment.imageUrl,
            fileName: assignment.fileName,
            createdAt: createdAssignment.createdAt,
          });

          // Queue AI analysis if requested
          if (input.analyzeImmediately) {
            analysisPromises.push(
              analyzeAssignmentAsync(
                createdAssignment.id,
                assignment.imageUrl,
                input.modelKey as AIModelKey || 'siliconcloud/qwen2.5-vl-7b'
              )
            );
          }
        }

        // Start analysis processes (don't wait for completion)
        if (analysisPromises.length > 0) {
          Promise.allSettled(analysisPromises).then(results => {
            const successful = results.filter(r => r.status === 'fulfilled').length;
            console.log(`Batch analysis completed: ${successful}/${results.length} successful`);
          }).catch(error => {
            console.error('Batch analysis error:', error);
          });
        }

        return {
          success: true,
          assignments: createdAssignments,
          analysisQueued: input.analyzeImmediately,
          totalCount: createdAssignments.length,
        };
      });

      return result;
    } catch (error) {
      if (error instanceof TRPCError) {
        throw error;
      }
      
      console.error("Batch parent upload error:", error);
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to upload assignments batch",
      });
    }
  });

export const batchTeacherUploadProcedure = authedProcedure
  .input(batchTeacherUploadSchema)
  .mutation(async ({ input, ctx }) => {
    try {
      // Verify all students exist and teacher has access to them
      const studentIds = input.assignments.map(a => a.studentId);
      const students = await db.student.findMany({
        where: { 
          id: { in: studentIds },
        },
        include: {
          class: {
            include: {
              teacher: true,
            },
          },
        },
      });

      // Check authorization for all students
      for (const student of students) {
        if (!student.class || student.class.teacher.id !== ctx.auth.teacherId) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: `You don't have access to student: ${student.name}`,
          });
        }
      }

      // Ensure all requested students were found
      if (students.length !== studentIds.length) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Some students were not found",
        });
      }

      // Process batch upload in a transaction
      const result = await db.$transaction(async (tx) => {
        const createdAssignments = [];

        for (const assignment of input.assignments) {
          const student = students.find(s => s.id === assignment.studentId);
          if (!student) continue;

          // Create assignment record
          const createdAssignment = await tx.assignment.create({
            data: {
              title: assignment.title,
              imageUrl: assignment.imageUrl,
              uploadedBy: "teacher",
              studentId: assignment.studentId,
              classId: student.classId,
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

          createdAssignments.push({
            id: createdAssignment.id,
            title: createdAssignment.title,
            imageUrl: createdAssignment.imageUrl,
            fileName: assignment.fileName,
            studentName: createdAssignment.student?.name ?? '',
            className: createdAssignment.student?.class?.name ?? '',
            createdAt: createdAssignment.createdAt,
          });
        }

        return {
          success: true,
          assignments: createdAssignments,
          totalCount: createdAssignments.length,
        };
      });

      return result;
    } catch (error) {
      if (error instanceof TRPCError) {
        throw error;
      }
      
      console.error("Batch teacher upload error:", error);
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to upload assignments batch",
      });
    }
  });

async function analyzeAssignmentAsync(
  assignmentId: number,
  imageUrl: string,
  modelKey: AIModelKey
) {
  try {
    // Fetch the image data
    const imageResponse = await fetch(imageUrl);
    if (!imageResponse.ok) {
      throw new Error("Could not fetch assignment image");
    }

    const imageBuffer = Buffer.from(await imageResponse.arrayBuffer());

    // Analyze the assignment with AI
    const result = await analyzeAssignment(imageBuffer, modelKey);

    // Store the analysis in the database
    await db.$transaction(async (tx) => {
      // Create the assignment analysis
      const assignmentAnalysis = await tx.assignmentAnalysis.create({
        data: {
          assignmentId: assignmentId,
          grade: result.grade,
          feedback: result.feedback,
          strengths: result.strengths,
          improvements: result.improvements,
        },
      });

      // Get assignment details for student ID
      const assignment = await tx.assignment.findUnique({
        where: { id: assignmentId },
        select: { studentId: true },
      });

      if (!assignment) return;

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
            studentId: assignment.studentId!,
            knowledgeAreaId: knowledgeArea.id,
          },
        });

        // Update or create student knowledge area proficiency
        const existingProficiency = await tx.studentKnowledgeArea.findUnique({
          where: {
            studentId_knowledgeAreaId: {
              studentId: assignment.studentId!,
              knowledgeAreaId: knowledgeArea.id,
            },
          },
        });

        if (existingProficiency) {
          // Decrease proficiency slightly when mistakes are found
          await tx.studentKnowledgeArea.update({
            where: { id: existingProficiency.id },
            data: {
              proficiencyLevel: existingProficiency.proficiencyLevel
                ? String(Math.max(0, parseFloat(existingProficiency.proficiencyLevel) - 0.1))
                : 'beginner',
            },
          });
        } else {
          // Create new proficiency record starting at 0.4 (below neutral due to mistake)
          await tx.studentKnowledgeArea.create({
            data: {
              studentId: assignment.studentId!,
              knowledgeAreaId: knowledgeArea.id,
              proficiencyLevel: 'beginner',
            },
          });
        }
      }
    });

    console.log(`Analysis completed for assignment ${assignmentId}`);
    return { success: true, assignmentId, modelUsed: modelKey };
  } catch (error) {
    console.error(`Analysis failed for assignment ${assignmentId}:`, error);
    throw error;
  }
}
