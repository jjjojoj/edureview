import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { db } from "~/server/db";
import { authedProcedure } from "~/server/trpc/main";
import { ossClient } from "~/server/storage";
import puppeteer from "puppeteer";

export const concludeClass = authedProcedure
  .input(z.object({ 
    classId: z.number(),
  }))
  .mutation(async ({ input, ctx }) => {
    try {
      // Verify class ownership and ensure it's not already archived
      const classData = await db.class.findFirst({
        where: {
          id: input.classId,
          teacherId: ctx.auth.teacherId,
          status: 'active', // Only allow archiving active classes
        },
        include: {
          teacher: {
            select: {
              name: true,
            },
          },
          students: {
            include: {
              assignments: {
                include: {
                  analysis: true,
                },
              },
              exams: {
                include: {
                  analysis: true,
                },
              },
              mistakes: {
                include: {
                  knowledgeArea: true,
                },
              },
              examMistakes: {
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
          },
        },
      });

      if (!classData) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Class not found, already archived, or you don't have permission to archive it",
        });
      }

      // Generate Individual Student Summary Reports
      const studentReports: string[] = [];
      let classPdfBuffer: Buffer | undefined;
      
      // Launch a single browser instance for all PDFs
      const browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
      });
      
      try {
        for (const student of classData.students) {
        const assignmentScores = student.assignments
          .filter(a => a.analysis?.grade)
          .map(a => parseFloat(a.analysis!.grade!));
        const examScores = student.exams
          .filter(e => e.analysis?.grade)
          .map(e => parseFloat(e.analysis!.grade!));
        
        const avgAssignmentScore = assignmentScores.length > 0 
          ? assignmentScores.reduce((sum, score) => sum + score, 0) / assignmentScores.length 
          : 0;
        const avgExamScore = examScores.length > 0 
          ? examScores.reduce((sum, score) => sum + score, 0) / examScores.length 
          : 0;
        
        const overallAverage = [...assignmentScores, ...examScores].length > 0
          ? [...assignmentScores, ...examScores].reduce((sum, score) => sum + score, 0) / [...assignmentScores, ...examScores].length
          : 0;

        // Get frequent mistakes
        const frequentMistakes = [...student.mistakes, ...student.examMistakes]
          .slice(0, 10) // Top 10 mistakes
          .map(mistake => mistake.description);

        // Get knowledge areas with proficiency
        const knowledgeAreas = student.studentKnowledgeAreas.map(ska => ({
          name: ska.knowledgeArea.name,
          proficiency: ska.proficiencyLevel || 'beginner'
        }));

        const studentHtml = `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="UTF-8">
            <title>学生总结报告 - ${student.name}</title>
            <style>
              body { font-family: 'SimHei', sans-serif; margin: 0; padding: 20px; color: #333; }
              .header { text-align: center; border-bottom: 2px solid #3b82f6; padding-bottom: 20px; margin-bottom: 30px; }
              .title { font-size: 28px; font-weight: bold; color: #1f2937; margin-bottom: 10px; }
              .subtitle { font-size: 16px; color: #6b7280; }
              .section { margin-bottom: 30px; }
              .section-title { font-size: 20px; font-weight: bold; color: #1f2937; border-left: 4px solid #3b82f6; padding-left: 15px; margin-bottom: 15px; }
              .stats-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; margin-bottom: 20px; }
              .stat-card { background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 15px; text-align: center; }
              .stat-number { font-size: 24px; font-weight: bold; color: #3b82f6; }
              .stat-label { font-size: 14px; color: #6b7280; margin-top: 5px; }
              .mistake-list { background: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; padding: 15px; }
              .mistake-item { margin-bottom: 8px; padding: 8px; background: white; border-radius: 4px; }
              .knowledge-areas { display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; }
              .knowledge-item { background: #f0f9ff; border: 1px solid #bae6fd; border-radius: 8px; padding: 10px; }
              .proficiency { font-size: 12px; color: #0369a1; font-weight: bold; }
              .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb; text-align: center; color: #6b7280; font-size: 14px; }
            </style>
          </head>
          <body>
            <div class="header">
              <div class="title">学生学年总结报告</div>
              <div class="subtitle">${student.name} | ${classData.name}</div>
              <div class="subtitle">教师: ${classData.teacher.name} | 生成时间: ${new Date().toLocaleString('zh-CN')}</div>
            </div>

            <div class="section">
              <div class="section-title">学习成绩概览</div>
              <div class="stats-grid">
                <div class="stat-card">
                  <div class="stat-number">${overallAverage.toFixed(1)}</div>
                  <div class="stat-label">总体平均分</div>
                </div>
                <div class="stat-card">
                  <div class="stat-number">${student.assignments.length}</div>
                  <div class="stat-label">完成作业数</div>
                </div>
                <div class="stat-card">
                  <div class="stat-number">${student.exams.length}</div>
                  <div class="stat-label">参加考试数</div>
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
                  <div class="stat-number">${student.mistakes.length + student.examMistakes.length}</div>
                  <div class="stat-label">错误总数</div>
                </div>
              </div>
            </div>

            ${frequentMistakes.length > 0 ? `
            <div class="section">
              <div class="section-title">常见错误分析</div>
              <div class="mistake-list">
                ${frequentMistakes.map(mistake => `<div class="mistake-item">• ${mistake}</div>`).join('')}
              </div>
            </div>
            ` : ''}

            ${knowledgeAreas.length > 0 ? `
            <div class="section">
              <div class="section-title">知识领域掌握情况</div>
              <div class="knowledge-areas">
                ${knowledgeAreas.map(ka => `
                  <div class="knowledge-item">
                    <div>${ka.name}</div>
                    <div class="proficiency">${ka.proficiency === 'beginner' ? '初级' : ka.proficiency === 'intermediate' ? '中级' : '高级'}</div>
                  </div>
                `).join('')}
              </div>
            </div>
            ` : ''}

            <div class="footer">
              <p>此报告总结了学生在本学年的整体表现 | 生成时间: ${new Date().toLocaleString('zh-CN')}</p>
            </div>
          </body>
          </html>
        `;

        // Generate PDF for this student using shared browser
        const page = await browser.newPage();
        await page.setContent(studentHtml, { waitUntil: 'networkidle0' });
        
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
        
        await page.close();

        // Upload student PDF to OSS
        const studentFileName = `student-summary-${student.id}-${Date.now()}.pdf`;
        const studentOssKey = `reports/students/${studentFileName}`;
        
        await ossClient.put(studentOssKey, pdfBuffer, {
          headers: {
            'Content-Type': 'application/pdf',
          },
        });

        studentReports.push(studentOssKey);
      }

      // Generate Class Analysis Report
      const totalAssignments = classData.students.reduce((sum, s) => sum + s.assignments.length, 0);
      const totalExams = classData.students.reduce((sum, s) => sum + s.exams.length, 0);
      const totalMistakes = classData.students.reduce((sum, s) => sum + s.mistakes.length + s.examMistakes.length, 0);
      
      const allScores = classData.students.flatMap(s => [
        ...s.assignments.filter(a => a.analysis?.grade).map(a => parseFloat(a.analysis!.grade!)),
        ...s.exams.filter(e => e.analysis?.grade).map(e => parseFloat(e.analysis!.grade!))
      ]);
      
      const classAverage = allScores.length > 0 
        ? allScores.reduce((sum, score) => sum + score, 0) / allScores.length 
        : 0;

      // Get common knowledge areas and mistakes
      const allKnowledgeAreas = new Set();
      const allMistakeDescriptions = [];
      
      classData.students.forEach(student => {
        student.studentKnowledgeAreas.forEach(ska => {
          allKnowledgeAreas.add(ska.knowledgeArea.name);
        });
        student.mistakes.forEach(mistake => {
          allMistakeDescriptions.push(mistake.description);
        });
        student.examMistakes.forEach(mistake => {
          allMistakeDescriptions.push(mistake.description);
        });
      });

      const classAnalysisHtml = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <title>班级分析报告 - ${classData.name}</title>
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
            .insights { background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 8px; padding: 20px; }
            .student-performance { display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px; }
            .student-card { background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 15px; }
            .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb; text-align: center; color: #6b7280; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="title">班级学年分析报告</div>
            <div class="subtitle">${classData.name} | 教师: ${classData.teacher.name}</div>
            <div class="subtitle">学年总结 | 生成时间: ${new Date().toLocaleString('zh-CN')}</div>
          </div>

          <div class="section">
            <div class="section-title">班级整体表现</div>
            <div class="stats-grid">
              <div class="stat-card">
                <div class="stat-number">${classData.students.length}</div>
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
                <div class="stat-number">${classAverage.toFixed(1)}</div>
                <div class="stat-label">班级平均分</div>
              </div>
            </div>
            
            <div class="stats-grid">
              <div class="stat-card">
                <div class="stat-number">${totalMistakes}</div>
                <div class="stat-label">错误总数</div>
              </div>
              <div class="stat-card">
                <div class="stat-number">${allKnowledgeAreas.size}</div>
                <div class="stat-label">涉及知识领域</div>
              </div>
              <div class="stat-card">
                <div class="stat-number">${classData.students.length > 0 ? (totalAssignments / classData.students.length).toFixed(1) : '0'}</div>
                <div class="stat-label">人均作业数</div>
              </div>
              <div class="stat-card">
                <div class="stat-number">${classData.students.length > 0 ? (totalExams / classData.students.length).toFixed(1) : '0'}</div>
                <div class="stat-label">人均考试数</div>
              </div>
            </div>
          </div>

          <div class="section">
            <div class="section-title">学生表现分布</div>
            <div class="student-performance">
              ${classData.students.map(student => {
                const studentScores = [
                  ...student.assignments.filter(a => a.analysis?.grade).map(a => parseFloat(a.analysis!.grade!)),
                  ...student.exams.filter(e => e.analysis?.grade).map(e => parseFloat(e.analysis!.grade!))
                ];
                const studentAvg = studentScores.length > 0 
                  ? studentScores.reduce((sum, score) => sum + score, 0) / studentScores.length 
                  : 0;
                
                return `
                  <div class="student-card">
                    <div style="font-weight: bold; margin-bottom: 8px;">${student.name}</div>
                    <div style="font-size: 14px; color: #6b7280;">
                      平均分: ${studentAvg.toFixed(1)} | 作业: ${student.assignments.length}个 | 考试: ${student.exams.length}个
                    </div>
                  </div>
                `;
              }).join('')}
            </div>
          </div>

          <div class="section">
            <div class="section-title">教学总结与建议</div>
            <div class="insights">
              <p><strong>班级优势：</strong></p>
              <ul>
                <li>班级平均成绩为 ${classAverage.toFixed(1)} 分，整体表现${classAverage >= 80 ? '优秀' : classAverage >= 70 ? '良好' : '有待提升'}</li>
                <li>学生积极参与，共完成 ${totalAssignments} 个作业和 ${totalExams} 个考试</li>
                <li>涵盖了 ${allKnowledgeAreas.size} 个知识领域，知识面较广</li>
              </ul>
              
              <p><strong>改进建议：</strong></p>
              <ul>
                <li>针对共计 ${totalMistakes} 个错误，建议加强薄弱知识点的巩固练习</li>
                <li>继续保持现有的教学方法，${classAverage >= 75 ? '学生整体掌握情况良好' : '可考虑调整教学策略以提高学习效果'}</li>
                <li>建议在下学年继续跟踪学生的学习进展</li>
              </ul>
            </div>
          </div>

          <div class="footer">
            <p>此报告总结了班级在本学年的整体表现和教学效果 | 生成时间: ${new Date().toLocaleString('zh-CN')}</p>
          </div>
        </body>
        </html>
      `;

      // Generate class analysis PDF using shared browser
      const classPage = await browser.newPage();
      await classPage.setContent(classAnalysisHtml, { waitUntil: 'networkidle0' });
      
      classPdfBuffer = await classPage.pdf({
        format: 'A4',
        printBackground: true,
        margin: {
          top: '20mm',
          right: '15mm',
          bottom: '20mm',
          left: '15mm',
        },
      });
      
      await classPage.close();
      } finally {
        // Ensure browser is always closed, even on error
        await browser.close();
      }

      // Upload class analysis PDF to OSS
      const classFileName = `class-analysis-${input.classId}-${Date.now()}.pdf`;
      const classOssKey = `reports/classes/${classFileName}`;
      
      await ossClient.put(classOssKey, classPdfBuffer, {
        headers: {
          'Content-Type': 'application/pdf',
        },
      });

      // Delete raw image data (assignments and exams)
      const imagesToDelete = [
        ...classData.students.flatMap(s => s.assignments.map(a => a.imageUrl)),
        ...classData.students.flatMap(s => s.exams.map(e => e.imageUrl))
      ].filter(Boolean);

      // Delete images from OSS (extract key from full URL)
      for (const imageUrl of imagesToDelete) {
        try {
          const urlParts = imageUrl.split('/');
          const ossKey = urlParts.slice(-2).join('/'); // Get the last two parts as the key
          await ossClient.delete(ossKey);
        } catch (error) {
          console.error(`Failed to delete image ${imageUrl}:`, error);
          // Continue with other deletions even if one fails
        }
      }

      // Update class status to archived and store report URLs
      const updatedClass = await db.class.update({
        where: { id: input.classId },
        data: {
          status: 'archived',
          archivedAt: new Date(),
          finalStudentReportUrl: studentReports.join(','), // Store as comma-separated list
          finalClassReportUrl: classOssKey,
        },
      });

      return {
        success: true,
        message: "班级已成功归档",
        archivedClass: {
          id: updatedClass.id,
          name: updatedClass.name,
          archivedAt: updatedClass.archivedAt,
          studentReportsCount: studentReports.length,
        },
      };

    } catch (error) {
      console.error('Error concluding class:', error);
      if (error instanceof TRPCError) {
        throw error;
      }
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to conclude class",
      });
    }
  });
