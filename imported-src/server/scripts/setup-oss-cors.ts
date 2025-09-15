import { ossClient } from "~/server/storage";
import { env } from "~/server/env";

/**
 * Sets up OSS CORS rules to allow browser uploads
 */
export async function setupOSSCORS() {
  try {
    console.log("Setting up OSS CORS rules...");
    
    // Define CORS rules to allow browser uploads
    const corsRules = [
      {
        allowedOrigin: ['http://localhost:3000', 'http://127.0.0.1:8000', 'http://localhost:8000'],
        allowedMethod: ['PUT', 'POST', 'GET', 'HEAD'],
        allowedHeader: ['*'],
        exposeHeader: ['ETag'],
        maxAgeSeconds: 3600
      }
    ];

    // If BASE_URL is set, add it to allowed origins
    if (env.BASE_URL) {
      corsRules[0].allowedOrigin.push(env.BASE_URL);
    }

    // Apply the CORS configuration
    await ossClient.putBucketCORS(env.OSS_BUCKET, corsRules);
    
    console.log("✅ OSS CORS rules configured successfully");
    console.log("Allowed origins:", corsRules[0].allowedOrigin);
    
    // Verify the configuration
    try {
      const result = await ossClient.getBucketCORS(env.OSS_BUCKET);
      console.log("Current CORS rules:", JSON.stringify(result, null, 2));
    } catch (verifyError) {
      console.log("Could not verify CORS rules, but setup should be successful");
    }
    
  } catch (error) {
    console.error("❌ Failed to setup OSS CORS rules:", error);
    throw error;
  }
}

// Run setup if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  setupOSSCORS()
    .then(() => {
      console.log("OSS CORS setup completed");
      process.exit(0);
    })
    .catch((error) => {
      console.error("OSS CORS setup failed:", error);
      process.exit(1);
    });
}