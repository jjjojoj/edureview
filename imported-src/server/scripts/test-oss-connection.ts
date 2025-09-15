import { ossClient } from "~/server/storage";
import { env } from "~/server/env";

/**
 * Test OSS connection and functionality
 */
export async function testOSSConnection() {
  try {
    console.log("Testing OSS connection...");
    
    // Test 1: List buckets (basic connection test)
    console.log("1. Testing basic connection...");
    const buckets = await ossClient.listBuckets();
    console.log("✅ Successfully connected to OSS");
    console.log(`Found buckets: ${buckets.buckets.map(b => b.name).join(", ")}`);
    
    // Test 2: Check if our bucket exists
    console.log("2. Checking bucket existence...");
    const bucketExists = buckets.buckets.some(b => b.name === env.OSS_BUCKET);
    if (bucketExists) {
      console.log(`✅ Bucket '${env.OSS_BUCKET}' exists`);
    } else {
      console.log(`❌ Bucket '${env.OSS_BUCKET}' not found`);
      return;
    }
    
    // Test 3: Test presigned URL generation
    console.log("3. Testing presigned URL generation...");
    const testFileName = `test/connection-test-${Date.now()}.txt`;
    
    const presignedUrl = await ossClient.signatureUrl(testFileName, {
      method: 'PUT',
      expires: 3600,
      'Content-Type': 'text/plain',
    });
    
    console.log("✅ Presigned URL generated successfully");
    console.log(`Presigned URL: ${presignedUrl}`);
    
    // Test 4: Test actual upload
    console.log("4. Testing actual upload...");
    const testContent = `OSS Connection Test - ${new Date().toISOString()}`;
    
    const uploadResult = await ossClient.put(testFileName, Buffer.from(testContent));
    console.log("✅ Test file uploaded successfully");
    console.log(`Upload result: ${uploadResult.url}`);
    
    // Test 5: Clean up test file
    console.log("5. Cleaning up test file...");
    await ossClient.delete(testFileName);
    console.log("✅ Test file deleted successfully");
    
    console.log("\n🎉 All OSS tests passed! Connection is working properly.");
    
  } catch (error) {
    console.error("❌ OSS connection test failed:", error);
    
    if (error instanceof Error) {
      console.error("Error message:", error.message);
      console.error("Error stack:", error.stack);
    }
    
    // Check for specific error types
    if (error.code === 'InvalidAccessKeyId') {
      console.error("💡 Solution: Check your OSS_ACCESS_KEY_ID in .env file");
    } else if (error.code === 'SignatureDoesNotMatch') {
      console.error("💡 Solution: Check your OSS_ACCESS_KEY_SECRET in .env file");
    } else if (error.code === 'NoSuchBucket') {
      console.error("💡 Solution: Create the bucket in Alibaba Cloud console or check OSS_BUCKET name");
    }
    
    throw error;
  }
}

// Run test if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  testOSSConnection()
    .then(() => {
      console.log("OSS connection test completed");
      process.exit(0);
    })
    .catch((error) => {
      console.error("OSS connection test failed:", error);
      process.exit(1);
    });
}