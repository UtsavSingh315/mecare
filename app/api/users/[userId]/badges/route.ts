import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";
import { db } from "@/lib/db";
import { userBadges, badges } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";

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

    // Get user's badges
    const userBadgeData = await db
      .select({
        id: userBadges.id,
        badgeId: userBadges.badgeId,
        earnedAt: userBadges.earnedAt,
        progress: userBadges.progress,
        name: badges.name,
        description: badges.description,
        icon: badges.icon,
        category: badges.category,
      })
      .from(userBadges)
      .innerJoin(badges, eq(userBadges.badgeId, badges.id))
      .where(eq(userBadges.userId, userId))
      .orderBy(desc(userBadges.earnedAt));

    // Get all available badges for comparison
    const allBadges = await db
      .select()
      .from(badges)
      .where(eq(badges.isActive, true));

    const earnedBadgeIds = new Set(userBadgeData.map((b) => b.badgeId));
    const availableBadges = allBadges.filter(
      (badge) => !earnedBadgeIds.has(badge.id)
    );

    return NextResponse.json({
      earned: userBadgeData.map((badge) => ({
        id: badge.id,
        name: badge.name,
        description: badge.description,
        icon: badge.icon,
        category: badge.category,
        earnedAt: badge.earnedAt,
        progress: badge.progress,
      })),
      available: availableBadges.map((badge) => ({
        id: badge.id,
        name: badge.name,
        description: badge.description,
        icon: badge.icon,
        category: badge.category,
        requirement: badge.requirement,
      })),
      stats: {
        totalEarned: userBadgeData.length,
        totalAvailable: allBadges.length,
        completionPercentage: Math.round(
          (userBadgeData.length / allBadges.length) * 100
        ),
      },
    });
  } catch (error) {
    console.error("Error fetching user badges:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
