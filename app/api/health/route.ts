import { NextResponse } from "next/server";
import { healthCheck } from "@/lib/db/health";

export async function GET() {
  try {
    const health = await healthCheck();

    return NextResponse.json(health, {
      status: health.status === "healthy" ? 200 : 503,
    });
  } catch (error) {
    return NextResponse.json(
      {
        status: "unhealthy",
        error: "Health check failed",
        timestamp: new Date().toISOString(),
      },
      { status: 503 }
    );
  }
}
