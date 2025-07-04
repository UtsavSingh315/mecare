import { db } from "@/lib/db";

export async function checkDatabaseConnection() {
  try {
    // Simple query to test connection
    await db.execute("SELECT 1");
    return { connected: true, error: null };
  } catch (error) {
    console.error("Database connection failed:", error);
    return {
      connected: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

export async function healthCheck() {
  const dbStatus = await checkDatabaseConnection();

  return {
    status: dbStatus.connected ? "healthy" : "unhealthy",
    database: dbStatus,
    timestamp: new Date().toISOString(),
  };
}
