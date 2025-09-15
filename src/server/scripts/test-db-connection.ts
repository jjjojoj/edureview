import { db } from "~/server/db";

async function testDatabaseConnection() {
  console.log("Testing database connection...");
  
  try {
    // Test basic connection
    await db.$connect();
    console.log("✅ Database connection successful");
    
    // Test a simple query
    const result = await db.$queryRaw`SELECT 1 as test`;
    console.log("✅ Basic query successful:", result);
    
    // Test knowledge areas table (should exist from setup)
    const knowledgeAreasCount = await db.knowledgeArea.count();
    console.log(`✅ Knowledge areas table accessible, count: ${knowledgeAreasCount}`);
    
    // Test teachers table
    const teachersCount = await db.teacher.count();
    console.log(`✅ Teachers table accessible, count: ${teachersCount}`);
    
    // Test classes table
    const classesCount = await db.class.count();
    console.log(`✅ Classes table accessible, count: ${classesCount}`);
    
    console.log("🎉 All database tests passed!");
    
  } catch (error) {
    console.error("❌ Database connection failed:", error);
    throw error;
  } finally {
    await db.$disconnect();
  }
}

testDatabaseConnection()
  .then(() => {
    console.log("Database test complete");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Database test failed:", error);
    process.exit(1);
  });
