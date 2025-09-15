import { baseProcedure } from "~/server/trpc/main";
import { db } from "~/server/db";

export const healthCheck = baseProcedure
  .query(async () => {
    try {
      // Test database connection
      await db.$queryRaw`SELECT 1`;
      
      return {
        status: "healthy",
        timestamp: new Date().toISOString(),
        database: "connected"
      };
    } catch (error) {
      console.error("Health check failed:", error);
      return {
        status: "unhealthy",
        timestamp: new Date().toISOString(),
        database: "disconnected",
        error: error instanceof Error ? error.message : "Unknown error"
      };
    }
  });
