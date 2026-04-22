import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { db } from "~/server/db";
import { authedProcedure } from "~/server/trpc/main";
import { ossClient } from "~/server/storage";
import ExcelJS from "exceljs";

export const generateClassReportExcel = authedProcedure
  .input(z.object({ 
    classId: z.number(),
    timeRange: z.enum(['7d', '30d', '90d', '1y', 'all']).optional().default('30d'),
    includeDetailedScores: z.boolean().optional().default(true),
    includeMistakeAnalysis: z.boolean().optional().default(true),
  }))
  .mutation(async ({ input, ctx }) => {
    try {
      // Verify class ownership
      const classData = await db.class.findFirst({
        where: {
          id: input.classId,
          teacherId: ctx.auth.teacherId,
        },
        include: {
          teacher: {
            select: {
              name: true,
            },
          },
        },
      });

      if (!classData) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Class not found or you don't have permission to view it",
        });
      }

      // Calculate date range
      const now = new Date();
      let startDate: Date;
      
      switch (input.timeRange) {
        case '7d':
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case '30d':
          startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          break;
        case '90d':
          startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
          break;
        case '1y':
          startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
          break;
        case 'all':
        default:
          startDate = new Date(0);
          break;
      }

      // Get comprehensive student data
      const students = await db.student.findMany({
        where: {
          classId: input.classId,
        },
        include: {
          assignments: {
            where: {
              createdAt: { gte: startDate },
            },
            include: {
              analysis: true,
            },
            orderBy: {
              createdAt: 'asc',
            },
          },
          exams: {
            where: {
              createdAt: { gte: startDate },
            },
            include: {
              analysis: true,
            },
            orderBy: {
              createdAt: 'asc',
            },
          },
          mistakes: {
            where: {
              createdAt: { gte: startDate },
            },
            include: {
              knowledgeArea: true,
            },
          },
          examMistakes: {
            where: {
              createdAt: { gte: startDate },
            },
            include: {
              knowledgeArea: true,
            },
          },
          studentKnowledgeAreas: {
            include: {
              knowledgeArea: true,
            },
          },
        },
      });

      // Create Excel workbook
      const workbook = new ExcelJS.Workbook();
      workbook.creator = '智能教学系统';
      workbook.created = new Date();

      // Create summary sheet
      const summarySheet = workbook.addWorksheet('班级概况');
      
      // Add header styling
      summarySheet.getCell('A1').value = `班级报告 - ${classData.name}`;
      summarySheet.getCell('A1').font = { size: 16, bold: true };
      summarySheet.getCell('A2').value = `教师: ${classData.teacher.name}`;
      summarySheet.getCell('A3').value = `生成时间: ${new Date().toLocaleString('zh-CN')}`;
      summarySheet.getCell('A4').value = `时间范围: ${input.timeRange === '7d' ? '最近7天' : input.timeRange === '30d' ? '最近30天' : input.timeRange === '90d' ? '最近90天' : input.timeRange === '1y' ? '最近1年' : '全部时间'}`;

      // Add summary statistics
      const totalAssignments = students.reduce((sum, s) => sum + s.assignments.length, 0);
      const totalExams = students.reduce((sum, s) => sum + s.exams.length, 0);
      const totalMistakes = students.reduce((sum, s) => sum + s.mistakes.length + s.examMistakes.length, 0);
      
      summarySheet.getCell('A6').value = '统计数据';
      summarySheet.getCell('A6').font = { bold: true };
      summarySheet.getCell('A7').value = '学生总数:';
      summarySheet.getCell('B7').value = students.length;
      summarySheet.getCell('A8').value = '作业总数:';
      summarySheet.getCell('B8').value = totalAssignments;
      summarySheet.getCell('A9').value = '考试总数:';
      summarySheet.getCell('B9').value = totalExams;
      summarySheet.getCell('A10').value = '错误总数:';
      summarySheet.getCell('B10').value = totalMistakes;

      // Create student details sheet
      const studentsSheet = workbook.addWorksheet('学生详情');
      
      // Add headers
      const studentHeaders = ['姓名', '学号', '邮箱', '年级', '作业数', '考试数', '错误数', '作业平均分', '考试平均分'];
      studentsSheet.addRow(studentHeaders);
      
      // Style headers
      const headerRow = studentsSheet.getRow(1);
      headerRow.font = { bold: true };
      headerRow.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFE3F2FD' }
      };

      // Add student data
      students.forEach(student => {
        const assignmentScores = student.assignments.filter(a => a.analysis?.grade).map(a => parseFloat(a.analysis!.grade!));
        const examScores = student.exams.filter(e => e.analysis?.grade).map(e => parseFloat(e.analysis!.grade!));
        
        const avgAssignmentScore = assignmentScores.length > 0 
          ? assignmentScores.reduce((sum, score) => sum + score, 0) / assignmentScores.length 
          : 0;
        const avgExamScore = examScores.length > 0 
          ? examScores.reduce((sum, score) => sum + score, 0) / examScores.length 
          : 0;

        studentsSheet.addRow([
          student.name,
          student.studentId || '',
          student.email || '',
          student.grade || '',
          student.assignments.length,
          student.exams.length,
          student.mistakes.length + student.examMistakes.length,
          avgAssignmentScore > 0 ? avgAssignmentScore.toFixed(1) : '',
          avgExamScore > 0 ? avgExamScore.toFixed(1) : '',
        ]);
      });

      // Auto-fit columns
      studentsSheet.columns.forEach(column => {
        column.width = 15;
      });

      // Create detailed scores sheet if requested
      if (input.includeDetailedScores) {
        const scoresSheet = workbook.addWorksheet('详细成绩');
        
        // Collect all assignments and exams
        const allAssignments = students.flatMap(student => 
          student.assignments.map(assignment => ({
            studentName: student.name,
            studentId: student.studentId || '',
            title: assignment.title,
            type: '作业',
            score: assignment.analysis?.grade ? parseFloat(assignment.analysis.grade) : null,
            date: assignment.createdAt.toLocaleDateString('zh-CN'),
            feedback: assignment.analysis?.feedback || '',
          }))
        );

        const allExams = students.flatMap(student => 
          student.exams.map(exam => ({
            studentName: student.name,
            studentId: student.studentId || '',
            title: exam.title,
            type: '考试',
            score: exam.analysis?.grade ? parseFloat(exam.analysis.grade) : null,
            date: exam.createdAt.toLocaleDateString('zh-CN'),
            feedback: exam.analysis?.feedback || '',
          }))
        );

        const allScores = [...allAssignments, ...allExams].sort((a, b) => 
          new Date(a.date).getTime() - new Date(b.date).getTime()
        );

        // Add headers
        const scoresHeaders = ['学生姓名', '学号', '题目', '类型', '分数', '日期', '反馈'];
        scoresSheet.addRow(scoresHeaders);
        
        // Style headers
        const scoresHeaderRow = scoresSheet.getRow(1);
        scoresHeaderRow.font = { bold: true };
        scoresHeaderRow.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFF3E5F5' }
        };

        // Add score data
        allScores.forEach(score => {
          scoresSheet.addRow([
            score.studentName,
            score.studentId,
            score.title,
            score.type,
            score.score || '',
            score.date,
            score.feedback,
          ]);
        });

        // Auto-fit columns
        scoresSheet.columns.forEach(column => {
          column.width = 20;
        });
      }

      // Create mistake analysis sheet if requested
      if (input.includeMistakeAnalysis) {
        const mistakesSheet = workbook.addWorksheet('错误分析');
        
        // Collect all mistakes
        const allMistakes = students.flatMap(student => [
          ...student.mistakes.map(mistake => ({
            studentName: student.name,
            studentId: student.studentId || '',
            description: mistake.description,
            knowledgeArea: mistake.knowledgeArea?.name || '未分类',
            type: '作业错误',
            date: mistake.createdAt.toLocaleDateString('zh-CN'),
          })),
          ...student.examMistakes.map(mistake => ({
            studentName: student.name,
            studentId: student.studentId || '',
            description: mistake.description,
            knowledgeArea: mistake.knowledgeArea?.name || '未分类',
            type: '考试错误',
            date: mistake.createdAt.toLocaleDateString('zh-CN'),
          }))
        ]);

        // Add headers
        const mistakeHeaders = ['学生姓名', '学号', '错误描述', '知识领域', '类型', '日期'];
        mistakesSheet.addRow(mistakeHeaders);
        
        // Style headers
        const mistakeHeaderRow = mistakesSheet.getRow(1);
        mistakeHeaderRow.font = { bold: true };
        mistakeHeaderRow.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFFFE8E8' }
        };

        // Add mistake data
        allMistakes.forEach(mistake => {
          mistakesSheet.addRow([
            mistake.studentName,
            mistake.studentId,
            mistake.description,
            mistake.knowledgeArea,
            mistake.type,
            mistake.date,
          ]);
        });

        // Auto-fit columns
        mistakesSheet.columns.forEach(column => {
          column.width = 25;
        });
      }

      // Generate Excel buffer
      const excelBuffer = await workbook.xlsx.writeBuffer();

      // Upload Excel to OSS
      const fileName = `class-report-${input.classId}-${Date.now()}.xlsx`;
      const ossKey = `reports/${fileName}`;
      
      await ossClient.put(ossKey, excelBuffer, {
        headers: {
          'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        },
      });

      // Generate download URL
      const downloadUrl = await ossClient.signatureUrl(ossKey, {
        expires: 3600, // 1 hour expiry
        response: {
          'content-disposition': `attachment; filename="${encodeURIComponent(`${classData.name}-数据报告-${new Date().toLocaleDateString('zh-CN')}.xlsx`)}"`,
        },
      });

      return {
        success: true,
        downloadUrl,
        fileName: `${classData.name}-数据报告-${new Date().toLocaleDateString('zh-CN')}.xlsx`,
        fileSize: (excelBuffer as Buffer).byteLength,
        expiresIn: 3600,
      };

    } catch (error) {
      console.error('Error generating Excel report:', error);
      if (error instanceof TRPCError) {
        throw error;
      }
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to generate Excel report",
      });
    }
  });
