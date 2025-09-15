import { ossClient } from "~/server/storage";
import { env } from "~/server/env";

/**
 * Test OSS image access using a sample uploaded image
 */
export async function testOSSImageAccess() {
  try {
    console.log("Testing OSS image access...");
    
    // List recent files in the assignment-uploads folder
    console.log("Listing recent files...");
    const listResult = await ossClient.list({
      prefix: 'assignment-uploads/',
      'max-keys': 5
    });

    if (!listResult.objects || listResult.objects.length === 0) {
      console.log("No files found in assignment-uploads folder");
      return { success: false, error: "No files found" };
    }

    // Get the most recent file
    const recentFile = listResult.objects[0];
    console.log("Most recent file:", recentFile.name);
    console.log("File size:", recentFile.size, "bytes");
    console.log("Last modified:", recentFile.lastModified);

    // Try to fetch the file
    console.log("Fetching file content...");
    const result = await ossClient.get(recentFile.name);
    
    console.log("✅ OSS image access successful!");
    console.log("Content length:", result.content?.length || 0);
    console.log("Content type:", result.res?.headers?.['content-type']);
    
    return {
      success: true,
      fileName: recentFile.name,
      fileSize: recentFile.size,
      contentLength: result.content?.length || 0,
      contentType: result.res?.headers?.['content-type']
    };
    
  } catch (error) {
    console.error("❌ OSS image access failed:", error);
    
    if (error instanceof Error) {
      console.error("Error message:", error.message);
      console.error("Error name:", error.constructor.name);
    }
    
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

// Run test if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  testOSSImageAccess()
    .then((result) => {
      if (result.success) {
        console.log("OSS image access test completed successfully");
        process.exit(0);
      } else {
        console.log("OSS image access test failed");
        process.exit(1);
      }
    })
    .catch((error) => {
      console.error("OSS test error:", error);
      process.exit(1);
    });
}