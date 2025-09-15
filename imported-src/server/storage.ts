import OSS from "ali-oss";
import { env } from "./env";

export const ossClient = new OSS({
  accessKeyId: env.OSS_ACCESS_KEY_ID,
  accessKeySecret: env.OSS_ACCESS_KEY_SECRET,
  endpoint: env.OSS_ENDPOINT,
  bucket: env.OSS_BUCKET,
  region: env.OSS_REGION,
  secure: true, // Force HTTPS for all requests
});

// Helper function to get OSS object URL
export function getOSSObjectUrl(objectName: string): string {
  return `https://${env.OSS_BUCKET}.${env.OSS_ENDPOINT}/${objectName}`;
}
