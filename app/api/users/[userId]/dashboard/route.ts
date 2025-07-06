import { NextRequest, NextResponse } from "next/server";
import { getDashboardDataOptimized, getCachedUser } from "@/lib/db/performance-utils";
import { verifyToken } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  let userId: string | undefined;
  try {
    const paramsResult = await params;
    userId = paramsResult.userId;

    if (!userId) {
      return NextResponse.json(
        { error: "userId is required" },
        { status: 400 }
      );
    }

    // Verify token with caching
    const authHeader = request.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const tokenData = await getCachedUser(token);
    if (!tokenData || tokenData.id !== userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get optimized dashboard data (all queries run in parallel)
    const dashboardData = await getDashboardDataOptimized(userId);

    return NextResponse.json(dashboardData);
  } catch (error) {
    console.error("Error fetching user dashboard:", error);
    console.error("Error details:", {
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      userId: userId,
    });
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
