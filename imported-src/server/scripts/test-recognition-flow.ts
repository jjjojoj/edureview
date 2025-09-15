import { ossClient } from "~/server/storage";
import { env } from "~/server/env";
import { recognizeStudentInfo } from "~/server/ai-service";
import { generateText } from "ai";
import { createOpenAI } from '@ai-sdk/openai';

/**
 * Test the complete recognition flow with a real uploaded image
 */
export async function testRecognitionFlow() {
  try {
    console.log("Testing complete recognition flow...");
    
    // Step 1: Get a recent uploaded image
    console.log("Step 1: Getting recent uploaded image...");
    const listResult = await ossClient.list({
      prefix: 'assignment-uploads/',
      'max-keys': 1
    });

    if (!listResult.objects || listResult.objects.length === 0) {
      throw new Error("No uploaded images found for testing");
    }

    const testFile = listResult.objects[0];
    const imageUrl = `https://${env.OSS_BUCKET}.${env.OSS_ENDPOINT}/${testFile.name}`;
    console.log("Test image URL:", imageUrl);
    console.log("Test file size:", testFile.size, "bytes");

    // Step 2: Extract object key from URL (same as in recognition procedure)
    console.log("Step 2: Extracting object key from URL...");
    const ossUrlPattern = new RegExp(`https://${env.OSS_BUCKET}\\.${env.OSS_ENDPOINT}/(.+)`);
    const match = imageUrl.match(ossUrlPattern);
    
    if (!match) {
      throw new Error(`Invalid OSS URL format: ${imageUrl}`);
    }

    const objectKey = match[1];
    console.log("Extracted object key:", objectKey);

    // Step 3: Fetch image from OSS
    console.log("Step 3: Fetching image from OSS...");
    const result = await ossClient.get(objectKey);
    
    if (!result.content) {
      throw new Error("Empty image content from OSS");
    }

    const imageBuffer = Buffer.from(result.content);
    console.log("Image buffer size:", imageBuffer.length, "bytes");

    // Step 4: Call AI recognition with debugging
    console.log("Step 4: Calling AI recognition with SiliconCloud Qwen2.5-VL-7B (generateText approach)...");
    
    // Let's also test the raw response first
    const siliconcloud = createOpenAI({
      apiKey: env.SILICONCLOUD_API_KEY,
      baseURL: 'https://api.siliconflow.cn/v1',
    });
    console.log("Testing raw SiliconCloud response...");
    
    try {
      const rawResult = await generateText({
        model: siliconcloud('Pro/Qwen/Qwen2.5-VL-7B-Instruct'),
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: `请仔细分析这份作业图片，识别学生姓名和班级信息。

请严格按照以下JSON格式返回结果：
{
  "studentName": "学生姓名",
  "className": "班级信息",
  "confidence": 置信度数字,
  "reasoning": "识别理由"
}

重要提示：
- 仔细查看图片中的所有文字
- 查找姓名、学号、班级等标识
- 如果是中文作业，重点关注中文姓名
- 如果找到任何可能的学生信息，请提取出来
- 置信度设置为0-1之间的数字

请直接返回JSON，不要添加任何其他文字。`,
              },
              {
                type: "image", 
                image: imageBuffer,
              },
            ],
          },
        ],
      });
      
      console.log("Raw SiliconCloud response:");
      console.log("---");
      console.log(rawResult.text);
      console.log("---");
      
    } catch (rawError) {
      console.error("Raw test failed:", rawError);
    }
    
    const recognition = await recognizeStudentInfo(imageBuffer, 'siliconcloud/qwen2.5-vl-7b');
    
    console.log("✅ Recognition flow completed successfully!");
    console.log("Recognition result:", {
      studentName: recognition.studentName,
      className: recognition.className,
      confidence: recognition.confidence,
      reasoning: recognition.reasoning
    });
    
    return {
      success: true,
      imageUrl,
      objectKey,
      imageSize: imageBuffer.length,
      recognition
    };
    
  } catch (error) {
    console.error("❌ Recognition flow failed:", error);
    
    if (error instanceof Error) {
      console.error("Error message:", error.message);
      console.error("Error stack:", error.stack);
    }
    
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

// Run test if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  testRecognitionFlow()
    .then((result) => {
      if (result.success) {
        console.log("Recognition flow test completed successfully");
        process.exit(0);
      } else {
        console.log("Recognition flow test failed");
        process.exit(1);
      }
    })
    .catch((error) => {
      console.error("Recognition flow test error:", error);
      process.exit(1);
    });
}