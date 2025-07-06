import { NextRequest, NextResponse } from "next/server";
import { getUserProfile, getUserStreaks, getUserBadges, getTotalDailyLogsCount, getCurrentCycleDay } from "@/lib/db/utils";
import { verifyToken } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params;

    if (!userId) {
      return NextResponse.json(
        { error: "userId is required" },
        { status: 400 }
      );
    }

    // Verify token
    const authHeader = request.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const tokenData = await verifyToken(token);
    if (!tokenData || tokenData.id !== userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user data
    const profile = await getUserProfile(userId);
    if (!profile) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const streaksData = await getUserStreaks(userId);
    const badges = await getUserBadges(userId);

    // Get actual counts and cycle data
    const totalLogged = await getTotalDailyLogsCount(userId);
    const currentCycleDay = await getCurrentCycleDay(userId);

    // Extract current streak from streaks data
    const currentStreak =
      streaksData.find((s) => s.type === "logging")?.currentStreak || 0;

    return NextResponse.json({
      currentStreak: currentStreak,
      totalLogged: totalLogged,
      badges: badges.map((b) => b.badge?.name || "Unknown Badge"),
      currentCycle: currentCycleDay,
      averageCycle: 28, // This could be made dynamic from user profile
      nextPeriod: null, // Will be calculated from cycle data
      fertilityWindow: {
        start: null,
        end: null,
      },
    });
  } catch (error) {
    console.error("Error fetching user dashboard:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
