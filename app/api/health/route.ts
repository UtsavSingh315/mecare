import { NextResponse } from "next/server";
import { healthCheck } from "@/lib/db/health";

export async function GET() {
  try {
    // Check environment variables
    const hasDbUrl = !!process.env.DATABASE_URL;
    const hasJwtSecret = !!process.env.JWT_SECRET;
    
    // Try database health check
    let dbHealth = null;
    try {
      dbHealth = await healthCheck();
    } catch (dbError) {
      dbHealth = {
        status: "unhealthy",
        error: dbError instanceof Error ? dbError.message : "Unknown database error"
      };
    }

    const health = {
      status: hasDbUrl && hasJwtSecret && dbHealth?.status === "healthy" ? "healthy" : "unhealthy",
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || "unknown",
      checks: {
        database_url: hasDbUrl ? "present" : "missing",
        jwt_secret: hasJwtSecret ? "present" : "missing",
        database: dbHealth
      }
    };

    return NextResponse.json(health, {
      status: health.status === "healthy" ? 200 : 503,
    });
  } catch (error) {
    return NextResponse.json(
      {
        status: "unhealthy",
        error: error instanceof Error ? error.message : "Health check failed",
        timestamp: new Date().toISOString(),
      },
      { status: 503 }
    );
  }
}
