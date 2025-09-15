import { ossClient } from "~/server/storage";
import { env } from "~/server/env";

/**
 * Sets up OSS lifecycle rules to automatically delete files after 14 days
 */
export async function setupOSSLifecycle() {
  try {
    console.log("Setting up OSS lifecycle rules...");
    
    // Define lifecycle rule to delete objects after 14 days
    const lifecycleRule = {
      id: 'delete-after-14-days',
      status: 'Enabled',
      prefix: '', // Apply to all objects in the bucket
      expiration: {
        days: 14,
      },
      abortMultipartUpload: {
        days: 1, // Clean up incomplete multipart uploads after 1 day
      },
    };

    // Apply the lifecycle configuration
    await ossClient.putBucketLifecycle(env.OSS_BUCKET, [lifecycleRule]);
    
    console.log("✅ OSS lifecycle rules configured successfully");
    console.log("- Files will be automatically deleted after 14 days");
    console.log("- Incomplete multipart uploads cleaned up after 1 day");
    
    // Verify the configuration
    const result = await ossClient.getBucketLifecycle(env.OSS_BUCKET);
    console.log("Current lifecycle rules:", JSON.stringify(result, null, 2));
    
  } catch (error) {
    console.error("❌ Failed to setup OSS lifecycle rules:", error);
    throw error;
  }
}

// Run setup if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  setupOSSLifecycle()
    .then(() => {
      console.log("OSS lifecycle setup completed");
      process.exit(0);
    })
    .catch((error) => {
      console.error("OSS lifecycle setup failed:", error);
      process.exit(1);
    });
}