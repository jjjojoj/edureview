import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { db } from "~/server/db";
import { authedProcedure } from "~/server/trpc/main";
import { ossClient } from "~/server/storage";
import puppeteer from "puppeteer";

export const generateClassReportPdf = authedProcedure
  .input(z.object({ 
    classId: z.number(),
    timeRange: z.enum(['7d', '30d', '90d', '1y', 'all']).optional().default('30d'),
    includeStudentDetails: z.boolean().optional().default(true),
    includePerformanceCharts: z.boolean().optional().default(true),
    includeAIInsights: z.boolean().optional().default(true),
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

      // Get students and their performance data
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
          },
          exams: {
            where: {
              createdAt: { gte: startDate },
            },
            include: {
              analysis: true,
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

      // Generate report data
      const totalAssignments = students.reduce((sum, s) => sum + s.assignments.length, 0);
      const totalExams = students.reduce((sum, s) => sum + s.exams.length, 0);
      const totalMistakes = students.reduce((sum, s) => sum + s.mistakes.length + s.examMistakes.length, 0);
      
      const assignmentScores = students.flatMap(s => 
        s.assignments.filter(a => a.analysis?.grade).map(a => parseFloat(a.analysis!.grade!))
      );
      const examScores = students.flatMap(s => 
        s.exams.filter(e => e.analysis?.grade).map(e => parseFloat(e.analysis!.grade!))
      );
      
      const avgAssignmentScore = assignmentScores.length > 0 
        ? assignmentScores.reduce((sum, score) => sum + score, 0) / assignmentScores.length 
        : 0;
      const avgExamScore = examScores.length > 0 
        ? examScores.reduce((sum, score) => sum + score, 0) / examScores.length 
        : 0;

      // Get AI insights if requested
      let aiInsights = '';
      if (input.includeAIInsights) {
        try {
          const progressAnalysis = await db.assignmentAnalysis.findFirst({
            where: {
              assignment: {
                studentId: { in: students.map(s => s.id) },
              },
            },
            orderBy: { createdAt: 'desc' },
          });
          aiInsights = progressAnalysis?.feedback || '暂无AI分析数据';
        } catch (error) {
          aiInsights = '获取AI分析时出现错误';
        }
      }

      // Generate HTML content for PDF
      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <title>班级报告 - ${classData.name}</title>
          <style>
            body { font-family: 'SimHei', sans-serif; margin: 0; padding: 20px; color: #333; }
            .header { text-align: center; border-bottom: 2px solid #3b82f6; padding-bottom: 20px; margin-bottom: 30px; }
            .title { font-size: 28px; font-weight: bold; color: #1f2937; margin-bottom: 10px; }
            .subtitle { font-size: 16px; color: #6b7280; }
            .section { margin-bottom: 30px; }
            .section-title { font-size: 20px; font-weight: bold; color: #1f2937; border-left: 4px solid #3b82f6; padding-left: 15px; margin-bottom: 15px; }
            .stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; margin-bottom: 20px; }
            .stat-card { background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 15px; text-align: center; }
            .stat-number { font-size: 24px; font-weight: bold; color: #3b82f6; }
            .stat-label { font-size: 14px; color: #6b7280; margin-top: 5px; }
            .student-list { display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px; }
            .student-card { background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 15px; }
            .student-name { font-weight: bold; color: #1f2937; margin-bottom: 8px; }
            .student-stats { font-size: 14px; color: #6b7280; }
            .ai-insights { background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 8px; padding: 20px; }
            .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb; text-align: center; color: #6b7280; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="title">班级表现报告</div>
            <div class="subtitle">${classData.name} | 教师: ${classData.teacher.name}</div>
            <div class="subtitle">报告时间范围: ${input.timeRange === '7d' ? '最近7天' : input.timeRange === '30d' ? '最近30天' : input.timeRange === '90d' ? '最近90天' : input.timeRange === '1y' ? '最近1年' : '全部时间'}</div>
            <div class="subtitle">生成时间: ${new Date().toLocaleString('zh-CN')}</div>
          </div>

          <div class="section">
            <div class="section-title">班级概况</div>
            <div class="stats-grid">
              <div class="stat-card">
                <div class="stat-number">${students.length}</div>
                <div class="stat-label">学生总数</div>
              </div>
              <div class="stat-card">
                <div class="stat-number">${totalAssignments}</div>
                <div class="stat-label">作业总数</div>
              </div>
              <div class="stat-card">
                <div class="stat-number">${totalExams}</div>
                <div class="stat-label">考试总数</div>
              </div>
              <div class="stat-card">
                <div class="stat-number">${totalMistakes}</div>
                <div class="stat-label">错误总数</div>
              </div>
            </div>
            <div class="stats-grid">
              <div class="stat-card">
                <div class="stat-number">${avgAssignmentScore.toFixed(1)}</div>
                <div class="stat-label">作业平均分</div>
              </div>
              <div class="stat-card">
                <div class="stat-number">${avgExamScore.toFixed(1)}</div>
                <div class="stat-label">考试平均分</div>
              </div>
              <div class="stat-card">
                <div class="stat-number">${students.length > 0 ? (totalAssignments / students.length).toFixed(1) : '0'}</div>
                <div class="stat-label">人均作业数</div>
              </div>
              <div class="stat-card">
                <div class="stat-number">${students.length > 0 ? (totalExams / students.length).toFixed(1) : '0'}</div>
                <div class="stat-label">人均考试数</div>
              </div>
            </div>
          </div>

          ${input.includeStudentDetails ? `
          <div class="section">
            <div class="section-title">学生详情</div>
            <div class="student-list">
              ${students.map(student => `
                <div class="student-card">
                  <div class="student-name">${student.name}</div>
                  <div class="student-stats">
                    作业: ${student.assignments.length}个 | 考试: ${student.exams.length}个<br>
                    错误: ${student.mistakes.length + student.examMistakes.length}个
                    ${student.assignments.filter(a => a.analysis?.grade).length > 0 ? `| 作业平均分: ${(student.assignments.filter(a => a.analysis?.grade).reduce((sum, a) => sum + parseFloat(a.analysis!.grade!), 0) / student.assignments.filter(a => a.analysis?.grade).length).toFixed(1)}` : ''}
                  </div>
                </div>
              `).join('')}
            </div>
          </div>
          ` : ''}

          ${input.includeAIInsights ? `
          <div class="section">
            <div class="section-title">AI 分析洞察</div>
            <div class="ai-insights">
              <p>${aiInsights}</p>
            </div>
          </div>
          ` : ''}

          <div class="footer">
            <p>此报告由智能教学系统自动生成 | 生成时间: ${new Date().toLocaleString('zh-CN')}</p>
          </div>
        </body>
        </html>
      `;

      // Generate PDF using puppeteer
      const browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
      });
      
      const page = await browser.newPage();
      await page.setContent(htmlContent, { waitUntil: 'networkidle0' });
      
      const pdfBuffer = await page.pdf({
        format: 'A4',
        printBackground: true,
        margin: {
          top: '20mm',
          right: '15mm',
          bottom: '20mm',
          left: '15mm',
        },
      });
      
      await browser.close();

      // Upload PDF to OSS
      const fileName = `class-report-${input.classId}-${Date.now()}.pdf`;
      const ossKey = `reports/${fileName}`;
      
      await ossClient.put(ossKey, pdfBuffer, {
        headers: {
          'Content-Type': 'application/pdf',
        },
      });

      // Generate download URL
      const downloadUrl = await ossClient.signatureUrl(ossKey, {
        expires: 3600, // 1 hour expiry
        response: {
          'content-disposition': `attachment; filename="${encodeURIComponent(`${classData.name}-报告-${new Date().toLocaleDateString('zh-CN')}.pdf`)}"`,
        },
      });

      return {
        success: true,
        downloadUrl,
        fileName: `${classData.name}-报告-${new Date().toLocaleDateString('zh-CN')}.pdf`,
        fileSize: pdfBuffer.length,
        expiresIn: 3600,
      };

    } catch (error) {
      console.error('Error generating PDF report:', error);
      if (error instanceof TRPCError) {
        throw error;
      }
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to generate PDF report",
      });
    }
  });
