import { NextRequest, NextResponse } from "next/server";
import { getUserProfile, getUserStreaks, getUserBadges } from "@/lib/db/utils";
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

    // Extract current streak from streaks data
    const currentStreak =
      streaksData.find((s) => s.type === "daily_log")?.currentStreak || 0;

    // For now, return basic data (can be enhanced later with cycle tracking)
    const totalLogged =
      streaksData.find((s) => s.type === "daily_log")?.longestStreak || 0;

    return NextResponse.json({
      currentStreak: currentStreak || 0,
      totalLogged: totalLogged || 0,
      badges: badges.map((b) => b.badge?.name || "Unknown Badge"),
      currentCycle: 1, // Default to day 1 until cycle tracking is implemented
      averageCycle: 28, // Default cycle length
      nextPeriod: null, // Will be calculated when cycle data is available
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
