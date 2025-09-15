import { ossClient } from "~/server/storage";
import { env } from "~/server/env";

/**
 * Sets up OSS bucket ACL to allow public read access
 */
export async function setupOSSACL() {
  try {
    console.log("Setting up OSS bucket ACL...");
    
    // Set bucket ACL to public-read to allow image access
    await ossClient.putBucketACL(env.OSS_BUCKET, 'public-read');
    
    console.log("✅ OSS bucket ACL configured successfully");
    console.log("- Bucket is now publicly readable");
    
    // Verify the configuration
    try {
      const result = await ossClient.getBucketACL(env.OSS_BUCKET);
      console.log("Current bucket ACL:", result.acl);
    } catch (verifyError) {
      console.log("Could not verify ACL, but setup should be successful");
    }
    
  } catch (error) {
    console.error("❌ Failed to setup OSS bucket ACL:", error);
    throw error;
  }
}

// Run setup if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  setupOSSACL()
    .then(() => {
      console.log("OSS ACL setup completed");
      process.exit(0);
    })
    .catch((error) => {
      console.error("OSS ACL setup failed:", error);
      process.exit(1);
    });
}