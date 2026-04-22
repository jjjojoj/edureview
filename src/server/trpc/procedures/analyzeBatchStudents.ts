import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { authedProcedure } from "~/server/trpc/main";
import { generateText } from "ai";
import { AI_MODELS, type AIModelKey } from "~/server/ai-service";

// Schema for individual student data
const StudentDataSchema = z.object({
  studentName: z.string(),
  studentId: z.string().optional(),
  confidence: z.number().min(0).max(1),
  reasoning: z.string(),
});

// Response schema
const BatchAnalysisResponseSchema = z.object({
  students: z.array(StudentDataSchema),
  autoAssignedStudentIds: z.array(z.string()),
  confidence: z.number().min(0).max(1),
  reasoning: z.string(),
});

type StudentData = z.infer<typeof StudentDataSchema>;
type BatchAnalysisResponse = z.infer<typeof BatchAnalysisResponseSchema>;

/**
 * Parse text response to extract batch student data
 */
function parseBatchStudentResponse(text: string): BatchAnalysisResponse {
  console.log('Parsing AI response, length:', text?.length || 0);

  if (!text || text.trim().length === 0) {
    console.log('Empty response from AI');
    return {
      students: [],
      autoAssignedStudentIds: [],
      confidence: 0.1,
      reasoning: 'AI返回空响应',
    };
  }

  // Strip markdown code blocks if present
  let cleanText = text.trim();
  if (cleanText.startsWith('```json')) {
    cleanText = cleanText.replace(/^```json\s*/, '').replace(/\s*```$/, '');
  } else if (cleanText.startsWith('```')) {
    cleanText = cleanText.replace(/^```\s*/, '').replace(/\s*```$/, '');
  }

  // Try to find JSON in the text if it's not pure JSON
  if (!cleanText.startsWith('{')) {
    // Look for JSON objects more carefully
    const patterns = [
      /\{[\s\S]*?\}/g,  // Basic JSON object
      /\{.*?"students"[\s\S]*?\}/g,  // JSON with students key
    ];

    let found = false;
    for (const pattern of patterns) {
      const matches = cleanText.match(pattern);
      if (matches && matches.length > 0) {
        // Find the longest valid JSON match
        for (const match of matches) {
          try {
            JSON.parse(match);
            cleanText = match;
            found = true;
            break;
          } catch (e) {
            // Continue trying other matches
          }
        }
        if (found) break;
      }
    }
  }

  try {
    console.log('Attempting to parse JSON...');
    const parsed = JSON.parse(cleanText);
    console.log('Successfully parsed JSON, students count:', parsed.students?.length || 0);

    // Validate and transform the response
    const students = Array.isArray(parsed.students) ? parsed.students : [];
    const validStudents: StudentData[] = students.map((student: any, index: number) => {
      const name = typeof student.studentName === 'string' ? student.studentName.trim() :
                   (typeof student.name === 'string' ? student.name.trim() : `学生${index + 1}`);

      const id = typeof student.studentId === 'string' ? student.studentId.trim() :
                 (typeof student.id === 'string' ? student.id.trim() : undefined);

      return {
        studentName: name,
        studentId: id,
        confidence: typeof student.confidence === 'number' ? Math.min(Math.max(student.confidence, 0), 1) : 0.7,
        reasoning: typeof student.reasoning === 'string' ? student.reasoning : '自动解析的学生信息',
      };
    }).filter((student: StudentData) => student.studentName && student.studentName !== `学生${students.indexOf(student) + 1}`);

    // Improved auto-assignment strategy for student IDs
    const autoAssignedStudentIds: string[] = [];

    // First, collect all existing student IDs that were detected
    const detectedIds = validStudents
      .map(s => s.studentId)
      .filter(Boolean)
      .map(id => parseInt(id!))
      .filter(id => !isNaN(id))
      .sort((a, b) => a - b);

    // Find the pattern and next available ID
    let nextStudentId = 1;

    if (detectedIds.length > 0) {
      // Check if IDs follow a pattern (e.g., 001, 002, 003)
      const maxDetectedId = Math.max(...detectedIds);
      const minDetectedId = Math.min(...detectedIds);

      // If there's a clear numeric pattern, continue from the max
      if (maxDetectedId - minDetectedId < 100) { // Reasonable range
        nextStudentId = maxDetectedId + 1;
      }
    }

    // Assign IDs to students without them, with proper formatting
    validStudents.forEach((student) => {
      if (!student.studentId) {
        // Format with leading zeros if detected IDs use them
        let formattedId: string;

        if (detectedIds.length > 0) {
          // Check if any detected ID has leading zeros
          const hasLeadingZeros = validStudents.some(s =>
            s.studentId && s.studentId.startsWith('0') && s.studentId.length > 1
          );

          if (hasLeadingZeros) {
            // Use same format as detected IDs (e.g., 001, 002, 003)
            const maxLength = Math.max(...validStudents
              .map(s => s.studentId?.length || 0)
              .filter(l => l > 0), 3);
            formattedId = String(nextStudentId).padStart(maxLength, '0');
          } else {
            formattedId = String(nextStudentId);
          }
        } else {
          // Default format: 3-digit with leading zeros (001, 002, 003)
          formattedId = String(nextStudentId).padStart(3, '0');
        }

        student.studentId = formattedId;
        autoAssignedStudentIds.push(formattedId);
        nextStudentId++;
      }
    });

    console.log(`Processed ${validStudents.length} valid students, ${autoAssignedStudentIds.length} auto-assigned IDs`);

    return {
      students: validStudents,
      autoAssignedStudentIds,
      confidence: typeof parsed.confidence === 'number' ? Math.min(Math.max(parsed.confidence, 0), 1) : 0.7,
      reasoning: typeof parsed.reasoning === 'string' ? parsed.reasoning : '批量学生信息分析完成',
    };
  } catch (parseError) {
    console.log('JSON parsing failed, attempting manual extraction...');

    // Enhanced fallback: multiple extraction strategies
    const students: StudentData[] = [];
    const autoAssignedStudentIds: string[] = [];
    const lines = text.split('\n').filter(line => line.trim());

    // Strategy 1: Look for name and ID patterns
    for (const line of lines) {
      // Look for various patterns like "张三 001", "姓名: 张三 学号: 001", etc.
      const patterns = [
        /(?:姓名|name)[:：]\s*([^\s,，。\n"'`]+)(?:\s+(?:学号|id)[:：]?\s*([^\s,，。\n"'`]+))?/gi,
        /[\u4e00-\u9fff]{2,4}/g, // Chinese names (2-4 characters)
        /([^\s\d"'`,，。\n]{2,4})\s+(\d{1,6})/g, // Name followed by number
        /(\d{1,6})\s+([^\s\d"'`,，。\n]{2,4})/g, // Number followed by name
      ];

      for (const pattern of patterns) {
        let match;
        while ((match = pattern.exec(line)) !== null) {
          let name = '';
          let id = '';

          if (pattern.source.includes('姓名|name')) {
            name = match[1]?.trim() ?? '';
            id = match[2]?.trim() ?? '';
          } else if (pattern.source.includes('\\u4e00-\\u9fff')) {
            // Chinese name pattern
            name = match[0]?.trim() ?? '';
          } else if (pattern.source.includes('\\d.*[^\\s\\d"')) {
            id = match[1]?.trim() ?? '';
            name = match[2]?.trim() ?? '';
          } else if (pattern.source.includes('[^\\s\\d".*\\d')) {
            name = match[1]?.trim() ?? '';
            id = match[2]?.trim() ?? '';
          } else {
            name = match[0]?.trim() ?? '';
          }

          if (name && name.length >= 2 && name.length <= 8 &&
              !students.some(s => s.studentName === name)) {
            let studentId = id;

            if (!studentId) {
              // Auto-assign with proper formatting
              const nextId = students.length + 1;
              studentId = String(nextId).padStart(3, '0'); // Default: 001, 002, 003...
              autoAssignedStudentIds.push(studentId);
            }

            students.push({
              studentName: name,
              studentId,
              confidence: id ? 0.8 : 0.6,
              reasoning: id ? '从文本中提取姓名和学号' : '从文本中提取姓名，自动分配学号',
            });
          }
        }
      }
    }

    console.log(`Manual extraction found ${students.length} students`);

    // If still no students found, return empty but valid response
    if (students.length === 0) {
      return {
        students: [],
        autoAssignedStudentIds: [],
        confidence: 0.1,
        reasoning: '未能从图片中识别到学生信息，请检查图片质量或尝试其他模型',
      };
    }

    return {
      students: students.slice(0, 50), // Limit to reasonable number
      autoAssignedStudentIds,
      confidence: 0.6,
      reasoning: `通过文本分析识别到 ${students.length} 名学生`,
    };
  }
}

export const analyzeBatchStudents = authedProcedure
  .input(z.object({
    imageBase64: z.string(),
    modelKey: z.string().default('siliconcloud/qwen2.5-vl-7b'),
  }))
  .mutation(async ({ input, ctx }) => {
    try {
      const modelKey = input.modelKey as AIModelKey;
      const modelConfig = AI_MODELS[modelKey];

      if (!modelConfig) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Invalid AI model selected",
        });
      }

      if (!modelConfig.supportsVision) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `Model ${modelKey} does not support vision tasks`,
        });
      }

      // Convert base64 to buffer
      const imageBuffer = Buffer.from(input.imageBase64, 'base64');

      // Enhanced AI analysis with retry mechanism and multiple strategies
      let result;
      const maxRetries = 3;
      const retryDelay = 2000; // 2 seconds

      console.log(`Starting AI analysis with model: ${modelKey}`);

      // Helper function to attempt AI analysis
      const attemptAnalysis = async (attempt: number) => {
        console.log(`Analysis attempt ${attempt}/${maxRetries}`);

        const timeoutMs = attempt === 1 ? 30000 : 60000; // Shorter timeout for first try

        try {
          // Check image size and compress if too large
          let processedBuffer = imageBuffer;
          if (imageBuffer.length > 5 * 1024 * 1024) { // > 5MB
            console.log('Image too large, may cause issues. Size:', imageBuffer.length);
          }

          const analysisPromise = generateText({
            model: modelConfig.provider(modelConfig.model),
            messages: [
              {
                role: "user",
                content: [
                  {
                    type: "text",
                    text: `你是一个专业的学生名单识别助手，请仔细分析图片中的学生信息，精确识别学生姓名和学号。

请返回JSON格式：
{
  "students": [
    {"studentName": "张三", "studentId": "001", "confidence": 0.95, "reasoning": "清晰识别姓名和学号"}
  ],
  "confidence": 0.9,
  "reasoning": "整体识别情况说明"
}

识别要求：
1. 仔细识别每个学生的完整姓名（2-4个中文字符）
2. 识别学号（数字组合，如001、2023001等）
3. 如果没有明确的学号，不要猜测或编造
4. 置信度基于文字清晰度和识别准确性
5. 过滤掉不相关的文字和干扰信息
6. 确保姓名不重复

常见格式包括：
- 座位表：姓名 学号
- 花名册：序号 姓名 学号
- 考试签到表：姓名(学号)
- 作业名单：学号-姓名

请认真分析，返回准确的JSON结构：`,
                  },
                  {
                    type: "image",
                    image: processedBuffer,
                  },
                ],
              },
            ],
            maxTokens: 1500,
            temperature: 0.1, // Lower temperature for more consistent results
          });

          const timeoutPromise = new Promise((_, reject) =>
            setTimeout(() => reject(new Error(`Timeout after ${timeoutMs}ms`)), timeoutMs)
          );

          return await Promise.race([analysisPromise, timeoutPromise]);

        } catch (error: any) {
          console.error(`Attempt ${attempt} failed:`, error.message);

          // If this is the last attempt, throw the error
          if (attempt >= maxRetries) {
            throw error;
          }

          // Wait before retrying
          await new Promise(resolve => setTimeout(resolve, retryDelay * attempt));

          // Retry with the next attempt
          return attemptAnalysis(attempt + 1);
        }
      };

      try {
        result = await attemptAnalysis(1);
        console.log(`AI analysis completed successfully. Response length: ${(result as any).text?.length || 0}`);

      } catch (finalError: any) {
        console.error(`All AI analysis attempts failed:`, finalError);

        // Categorize and handle different types of errors
        let errorCode: string = "INTERNAL_SERVER_ERROR";
        let errorMessage: string = "AI分析失败";

        if (finalError.message?.includes('timeout') || finalError.message?.includes('Timeout')) {
          errorCode = "TIMEOUT";
          errorMessage = `AI分析超时。请尝试:\n1. 使用更小的图片(<2MB)\n2. 确保图片清晰\n3. 尝试其他模型\n4. 稍后重试`;
        } else if (finalError.message?.includes('stream') || finalError.message?.includes('closed')) {
          errorCode = "BAD_REQUEST";
          errorMessage = `网络连接问题。请尝试:\n1. 检查网络连接\n2. 稍后重试\n3. 更换其他AI模型`;
        } else if (finalError.message?.includes('rate') || finalError.message?.includes('limit') || finalError.message?.includes('quota')) {
          errorCode = "TOO_MANY_REQUESTS";
          errorMessage = `API调用限制。请稍后(2-3分钟)重试。`;
        } else if (finalError.message?.includes('auth') || finalError.message?.includes('unauthorized') || finalError.message?.includes('forbidden')) {
          errorCode = "UNAUTHORIZED";
          errorMessage = `AI服务认证问题。请联系管理员检查API配置。`;
        } else {
          errorMessage = `AI分析失败: ${finalError.message || '未知错误'}。请尝试其他模型或稍后重试。`;
        }

        throw new TRPCError({
          code: errorCode as any,
          message: errorMessage,
        });
      }

      // Parse the AI response
      let analysisResult;
      try {
        analysisResult = parseBatchStudentResponse((result as any).text);

        if (!analysisResult || analysisResult.students.length === 0) {
          // If no students found, provide fallback message
          analysisResult = {
            students: [],
            autoAssignedStudentIds: [],
            confidence: 0.1,
            reasoning: '未能从图片中识别到学生信息。请检查:\n1. 图片是否包含学生名单\n2. 文字是否清晰可读\n3. 尝试其他AI模型',
          };
        }

        console.log(`Parsed ${analysisResult.students.length} students successfully`);
      } catch (parseError: any) {
        console.error('Failed to parse AI response:', parseError);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `AI响应解析失败。原始响应: ${(result as any).text?.substring(0, 200) || '空'}`
        });
      }

      return {
        success: true,
        analysis: analysisResult,
      };
    } catch (error) {
      if (error instanceof TRPCError) {
        throw error;
      }

      console.error("Batch student analysis error:", error);

      // Handle different types of errors
      let errorMessage = "图片分析失败";

      if (error instanceof Error) {
        if (error.message.includes('JWT') || error.message.includes('token')) {
          errorMessage = "认证失败，请重新登录";
        } else if (error.message.includes('network') || error.message.includes('fetch')) {
          errorMessage = "网络连接失败，请检查网络";
        } else if (error.message.includes('timeout')) {
          errorMessage = "请求超时，请稍后重试";
        } else {
          errorMessage = `分析失败: ${error.message}`;
        }
      }

      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: errorMessage,
      });
    }
  });