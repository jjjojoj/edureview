import { generateText } from "ai";
import { createOpenAI } from '@ai-sdk/openai';
import { env } from "~/server/env";

// SiliconCloud provider (compatible with OpenAI API)
const siliconcloud = createOpenAI({
  apiKey: env.SILICONCLOUD_API_KEY,
  baseURL: 'https://api.siliconflow.cn/v1',
});

/**
 * Test SiliconCloud API connection with a simple text generation
 */
export async function testSiliconCloudConnection() {
  try {
    console.log("Testing SiliconCloud connection...");
    console.log("API Key present:", !!env.SILICONCLOUD_API_KEY);
    console.log("API Key prefix:", env.SILICONCLOUD_API_KEY?.substring(0, 8) + '...');
    
    const result = await generateText({
      model: siliconcloud('Pro/Qwen/Qwen2.5-VL-7B-Instruct'),
      messages: [
        {
          role: "user",
          content: "Hello, can you respond with just 'Connection successful'?"
        }
      ],
      maxTokens: 20,
    });

    console.log("✅ SiliconCloud connection successful!");
    console.log("Response:", result.text);
    
    return {
      success: true,
      response: result.text,
      usage: result.usage,
    };
    
  } catch (error) {
    console.error("❌ SiliconCloud connection failed:", error);
    
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
  testSiliconCloudConnection()
    .then((result) => {
      if (result.success) {
        console.log("SiliconCloud test completed successfully");
        process.exit(0);
      } else {
        console.log("SiliconCloud test failed");
        process.exit(1);
      }
    })
    .catch((error) => {
      console.error("SiliconCloud test error:", error);
      process.exit(1);
    });
}