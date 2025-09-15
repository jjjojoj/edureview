import { generateObject, generateText } from "ai";
import { createOpenAI } from '@ai-sdk/openai';
import { z } from "zod";
import { env } from "./env";

// AI Provider configurations
const openai = createOpenAI({
  apiKey: process.env.OPENAI_API_KEY || '',
});

// SiliconCloud provider (compatible with OpenAI API)
const siliconcloud = createOpenAI({
  apiKey: env.SILICONCLOUD_API_KEY,
  baseURL: 'https://api.siliconflow.cn/v1',
});

// Alibaba Bailian provider (compatible with OpenAI API)
const alibabaBailian = createOpenAI({
  apiKey: env.ALIBABA_BAILIAN_API_KEY,
  baseURL: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
});

// Available AI models configuration
export const AI_MODELS = {
  // Alibaba Bailian models (premium option with native Qwen support)
  'alibaba-bailian/qwen-vl-max': {
    provider: alibabaBailian,
    model: 'qwen-vl-max-latest',
    name: 'Qwen VL Max (Alibaba Bailian) - Premium',
    supportsVision: true,
  },

  // SiliconCloud models (default budget option with generateText approach)
  'siliconcloud/qwen2.5-vl-7b': {
    provider: siliconcloud,
    model: 'Pro/Qwen/Qwen2.5-VL-7B-Instruct',
    name: 'Qwen2.5-VL-7B (SiliconCloud) - Budget',
    supportsVision: true,
    useTextGeneration: true, // Use generateText instead of generateObject
    isDefault: true,
  },

  // Direct OpenAI (if API key is available)
  ...(process.env.OPENAI_API_KEY ? {
    'openai/gpt-4o': {
      provider: openai,
      model: 'gpt-4o',
      name: 'GPT-4o (Direct)',
      supportsVision: true,
    },
  } : {}),
} as const;

export type AIModelKey = keyof typeof AI_MODELS;

// Schema for student and class recognition
export const recognitionSchema = z.object({
  studentName: z.string().describe("在作业中找到的学生姓名，如果未找到则返回空字符串"),
  className: z.string().describe("在作业中找到的班级名称或标识符，如果未找到则返回空字符串"),
  confidence: z.number().min(0).max(1).describe("识别的置信度（0-1）"),
  reasoning: z.string().describe("简要说明使用了哪些文本/元素来识别学生姓名和班级"),
});

// Schema for assignment analysis
export const analysisSchema = z.object({
  grade: z.string().optional().describe("如果可见的话，整体成绩或分数"),
  feedback: z.string().describe("关于作业的一般反馈"),
  strengths: z.array(z.string()).describe("学生表现良好的方面"),
  improvements: z.array(z.string()).describe("需要改进的方面"),
  mistakes: z.array(z.object({
    description: z.string().describe("错误的描述"),
    knowledgeArea: z.string().describe("此错误相关的知识领域（例如：'数学-分数'、'英语-语法'）"),
  })).describe("在作业中识别的具体错误"),
});

// Schema for targeted question generation
export const targetedQuestionsSchema = z.object({
  questions: z.array(z.object({
    question: z.string().describe("The practice question text"),
    options: z.array(z.string()).optional().describe("Multiple choice options if applicable"),
    correctAnswer: z.string().describe("The correct answer"),
    explanation: z.string().describe("Explanation of why this is the correct answer"),
    knowledgeArea: z.string().describe("The knowledge area this question targets"),
    difficulty: z.enum(["easy", "medium", "hard"]).describe("Difficulty level of the question"),
    mistakeType: z.string().describe("The type of mistake this question helps address"),
  })).describe("Array of generated practice questions"),
  summary: z.string().describe("Brief summary of the learning gaps addressed by these questions"),
});

// Interface for question generation input
interface QuestionGenerationInput {
  mistakes: Array<{
    id: number;
    description: string;
    originalQuestionText?: string | null;
    originalQuestionImageUrl?: string | null;
    studentAnswer?: string | null;
    correctAnswer?: string | null;
    knowledgeArea?: {
      name: string;
      description: string;
    } | null;
  }>;
  teachingMaterials: Array<{
    id: number;
    title: string;
    description?: string | null;
    contentType: string;
    textContent?: string | null;
    knowledgeArea?: {
      name: string;
      description: string;
    } | null;
  }>;
  studentName: string;
  questionCount: number;
  difficultyLevel: "easy" | "medium" | "hard";
  modelKey: AIModelKey;
}

/**
 * Parse text response to extract structured recognition data
 */
function parseRecognitionResponse(text: string) {
  // Strip markdown code blocks if present
  let cleanText = text.trim();
  if (cleanText.startsWith('```json')) {
    cleanText = cleanText.replace(/^```json\s*/, '').replace(/\s*```$/, '');
  } else if (cleanText.startsWith('```')) {
    cleanText = cleanText.replace(/^```\s*/, '').replace(/\s*```$/, '');
  }

  try {
    // Try to parse as JSON first
    return JSON.parse(cleanText);
  } catch {
    // If not JSON, parse manually with regex
    const studentNameMatch = text.match(/(?:学生姓名|姓名|学生|name)[:：]\s*["']?([^"\n,，。]+)["']?/i);
    const classNameMatch = text.match(/(?:班级|class)[:：]\s*["']?([^"\n,，。]+)["']?/i);
    const confidenceMatch = text.match(/(?:置信度|confidence)[:：]\s*([\d.]+)/i);
    const reasoningMatch = text.match(/(?:原因|reasoning|理由)[:：]\s*["']?([^"]+)["']?/i);

    return {
      studentName: studentNameMatch?.[1]?.trim() || '',
      className: classNameMatch?.[1]?.trim() || '',
      confidence: confidenceMatch?.[1] ? parseFloat(confidenceMatch[1]) : 0.1,
      reasoning: reasoningMatch?.[1]?.trim() || '无法从图片中识别到学生姓名和班级信息'
    };
  }
}

/**
 * Recognize student name and class from assignment image
 */
export async function recognizeStudentInfo(
  imageBuffer: Buffer,
  modelKey: AIModelKey = 'siliconcloud/qwen2.5-vl-7b'
) {
  const modelConfig = AI_MODELS[modelKey];

  if (!modelConfig.supportsVision) {
    throw new Error(`Model ${modelKey} does not support vision tasks`);
  }

  try {
    // Check if this model uses text generation approach
    if ('useTextGeneration' in modelConfig && modelConfig.useTextGeneration) {
      // Use generateText for SiliconCloud models
      const result = await generateText({
        model: modelConfig.provider(modelConfig.model),
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: `请分析这份作业图片，尝试识别以下信息并以JSON格式返回：

请返回JSON格式：
{
  "studentName": "学生姓名（如果找不到则返回空字符串）",
  "className": "班级信息（如果找不到则返回空字符串）",
  "confidence": 0.0-1.0的置信度数字,
  "reasoning": "识别过程的简要说明"
}

重点关注：
- 页面右上角或左上角的姓名
- 标题部分的学生信息
- 班级标识（如"7年级2班"、"Class 7-2"等）
- 手写或打印的标签文本

如果无法找到清晰信息，请设置较低的置信度。`,
              },
              {
                type: "image",
                image: imageBuffer,
              },
            ],
          },
        ],
      });

      return parseRecognitionResponse(result.text);
    } else {
      // Use generateObject for models that support function calling
      const result = await generateObject({
        model: modelConfig.provider(modelConfig.model),
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: `请分析这份作业图片，尝试识别以下信息：

1. **学生姓名**：查找作业上写的任何学生姓名（可能是中文或英文）
2. **班级信息**：查找班级名称、编号或标识符（如"7年级2班"、"Class 7-2"等）

重点关注学生手写或打印的标题/标签文本。常见位置包括：
- 页面右上角或左上角
- 标题部分
- 姓名字段或签名区域
- 班级标识区域

如果无法找到清晰的学生姓名或班级信息，请返回空字符串并设置较低的置信度。`,
              },
              {
                type: "image",
                image: imageBuffer,
              },
            ],
          },
        ],
        schema: recognitionSchema,
      });

      return result.object;
    }
  } catch (error) {
    console.error(`Recognition error with ${modelKey}:`, error);
    throw error;
  }
}

/**
 * Parse text response to extract structured analysis data
 */
function parseAnalysisResponse(text: string) {
  // Strip markdown code blocks if present
  let cleanText = text.trim();
  if (cleanText.startsWith('```json')) {
    cleanText = cleanText.replace(/^```json\s*/, '').replace(/\s*```$/, '');
  } else if (cleanText.startsWith('```')) {
    cleanText = cleanText.replace(/^```\s*/, '').replace(/\s*```$/, '');
  }

  try {
    // Try to parse as JSON first
    return JSON.parse(cleanText);
  } catch {
    // If not JSON, parse manually
    const gradeMatch = text.match(/(?:成绩|分数|grade)[:：]\s*["']?([^"\n,，。]+)["']?/i);
    const feedbackMatch = text.match(/(?:反馈|feedback|总体评价)[:：]\s*["']?([^"]+?)(?=\n|$)/i);

    // Extract strengths, improvements, and mistakes from lists
    const strengthsText = text.match(/(?:优点|表现良好|strengths)[:：]\s*(.*?)(?=(?:需要改进|mistakes|错误|\n\n))/is)?.[1] || '';
    const improvementsText = text.match(/(?:需要改进|improvements)[:：]\s*(.*?)(?=(?:错误|mistakes|\n\n))/is)?.[1] || '';
    const mistakesText = text.match(/(?:错误|mistakes)[:：]\s*(.*?)$/is)?.[1] || '';

    const parseListItems = (text: string) => {
      return text.split(/[,，\n]/).map(item => item.replace(/^[-•]\s*/, '').trim()).filter(Boolean);
    };

    return {
      grade: gradeMatch?.[1]?.trim(),
      feedback: feedbackMatch?.[1]?.trim() || '作业分析完成',
      strengths: parseListItems(strengthsText),
      improvements: parseListItems(improvementsText),
      mistakes: parseListItems(mistakesText).map(desc => ({
        description: desc,
        knowledgeArea: '未分类'
      }))
    };
  }
}

export async function analyzeAssignment(
  imageBuffer: Buffer,
  modelKey: AIModelKey = 'siliconcloud/qwen2.5-vl-7b'
) {
  const modelConfig = AI_MODELS[modelKey];

  if (!modelConfig.supportsVision) {
    throw new Error(`Model ${modelKey} does not support vision tasks`);
  }

  try {
    // Check if this model uses text generation approach
    if ('useTextGeneration' in modelConfig && modelConfig.useTextGeneration) {
      // Use generateText for SiliconCloud models
      const result = await generateText({
        model: modelConfig.provider(modelConfig.model),
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: `请分析这份学生作业图片，以JSON格式返回分析结果：

请返回JSON格式：
{
  "grade": "可见的分数或成绩（如果没有则为null）",
  "feedback": "总体反馈",
  "strengths": ["学生表现良好的方面1", "方面2"],
  "improvements": ["需要改进的方面1", "方面2"],
  "mistakes": [
    {
      "description": "错误描述",
      "knowledgeArea": "相关知识领域"
    }
  ]
}

请查找：
1. 任何可见的分数或成绩
2. 作业中的错误或问题
3. 学生表现良好的方面
4. 需要改进的方面
5. 具体的知识盲点

提供建设性反馈，帮助学生改进学习。`,
              },
              {
                type: "image",
                image: imageBuffer,
              },
            ],
          },
        ],
      });

      return parseAnalysisResponse(result.text);
    } else {
      // Use generateObject for models that support function calling
      const result = await generateObject({
        model: modelConfig.provider(modelConfig.model),
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: `请分析这份学生作业图片。请查找以下内容：

1. 任何可见的分数或成绩
2. 作业中的错误或问题
3. 学生表现良好的方面
4. 需要改进的方面
5. 具体的知识盲点或学习机会

重点关注提供建设性的反馈，帮助学生改进学习。`,
              },
              {
                type: "image",
                image: imageBuffer,
              },
            ],
          },
        ],
        schema: analysisSchema,
      });

      return result.object;
    }
  } catch (error) {
    console.error(`Analysis error with ${modelKey}:`, error);
    throw error;
  }
}

/**
 * Parse text response to extract structured question data
 */
function parseQuestionGenerationResponse(text: string) {
  // Strip markdown code blocks if present
  let cleanText = text.trim();
  if (cleanText.startsWith('```json')) {
    cleanText = cleanText.replace(/^```json\s*/, '').replace(/\s*```$/, '');
  } else if (cleanText.startsWith('```')) {
    cleanText = cleanText.replace(/^```\s*/, '').replace(/\s*```$/, '');
  }

  try {
    // Try to parse as JSON first
    return JSON.parse(cleanText);
  } catch {
    // If not JSON, create a simple fallback structure
    return {
      questions: [{
        question: "基于学生的错误，请复习相关知识点并练习类似题目。",
        correctAnswer: "请参考教学材料中的相关内容。",
        explanation: "这是一个基于学生错误模式生成的练习题。",
        knowledgeArea: "综合复习",
        difficulty: "medium",
        mistakeType: "综合错误",
      }],
      summary: "基于学生的学习情况生成了针对性练习题。",
    };
  }
}

/**
 * Generate targeted practice questions based on student mistakes and teaching materials
 */
export async function generateTargetedQuestions(input: QuestionGenerationInput) {
  const modelConfig = AI_MODELS[input.modelKey];

  try {
    // Prepare context from teaching materials
    const knowledgeBaseContext = input.teachingMaterials
      .map(material => {
        const content = material.textContent || `Material: ${material.title}${material.description ? ` - ${material.description}` : ''}`;
        return `[${material.knowledgeArea?.name || '未分类'}] ${material.title}: ${content}`;
      })
      .join('\n\n');

    // Prepare mistake analysis
    const mistakeAnalysis = input.mistakes
      .map(mistake => {
        const knowledgeArea = mistake.knowledgeArea?.name || '未分类';
        const originalQuestion = mistake.originalQuestionText ? `原题: ${mistake.originalQuestionText}` : '';
        const studentAnswer = mistake.studentAnswer ? `学生答案: ${mistake.studentAnswer}` : '';
        const correctAnswer = mistake.correctAnswer ? `正确答案: ${mistake.correctAnswer}` : '';

        return `错误类型: ${mistake.description}
知识领域: ${knowledgeArea}
${originalQuestion}
${studentAnswer}
${correctAnswer}`.trim();
      })
      .join('\n\n');

    const prompt = `请基于以下信息为学生"${input.studentName}"生成${input.questionCount}道针对性练习题：

## 学生错误分析：
${mistakeAnalysis}

## 教师知识库参考资料：
${knowledgeBaseContext}

## 要求：
- 难度等级：${input.difficultyLevel}
- 题目数量：${input.questionCount}道
- 针对学生的具体错误模式设计
- 利用教师提供的知识库内容作为权威参考
- 提供详细的解题思路和知识点解释
- 帮助学生克服已识别的学习困难

请以JSON格式返回，包含以下结构：
{
  "questions": [
    {
      "question": "题目内容",
      "options": ["选项A", "选项B", "选项C", "选项D"] // 如果是选择题
      "correctAnswer": "正确答案",
      "explanation": "详细解释",
      "knowledgeArea": "知识领域",
      "difficulty": "easy/medium/hard",
      "mistakeType": "针对的错误类型"
    }
  ],
  "summary": "本次练习题的总体说明"
}`;

    // Check if this model uses text generation approach
    if ('useTextGeneration' in modelConfig && modelConfig.useTextGeneration) {
      // Use generateText for SiliconCloud models
      const result = await generateText({
        model: modelConfig.provider(modelConfig.model),
        messages: [
          {
            role: "user",
            content: prompt,
          },
        ],
      });

      return parseQuestionGenerationResponse(result.text);
    } else {
      // Use generateObject for models that support function calling
      const result = await generateObject({
        model: modelConfig.provider(modelConfig.model),
        messages: [
          {
            role: "user",
            content: prompt,
          },
        ],
        schema: targetedQuestionsSchema,
      });

      return result.object;
    }
  } catch (error) {
    console.error(`Question generation error with ${input.modelKey}:`, error);
    throw error;
  }
}

/**
 * Get list of available models for vision tasks
 */
export function getAvailableVisionModels() {
  return Object.entries(AI_MODELS)
    .filter(([_, config]) => config.supportsVision)
    .map(([key, config]) => ({
      key: key as AIModelKey,
      name: config.name,
      isDefault: config.isDefault || false,
    }));
}

/**
 * Get default model for vision tasks
 */
export function getDefaultVisionModel(): AIModelKey {
  const defaultModel = Object.entries(AI_MODELS).find(([_, config]) => 'isDefault' in config && config.isDefault);
  return (defaultModel?.[0] as AIModelKey) || 'siliconcloud/qwen2.5-vl-7b';
}
