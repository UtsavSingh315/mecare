import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";
import { db } from "@/lib/db";
import { userChallenges, challenges, dailyLogs } from "@/lib/db/schema";
import { eq, and, gte, count } from "drizzle-orm";

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

    // Get user's active challenges
    const userChallengeData = await db
      .select({
        id: userChallenges.id,
        challengeId: userChallenges.challengeId,
        currentProgress: userChallenges.currentProgress,
        isCompleted: userChallenges.isCompleted,
        joinedAt: userChallenges.joinedAt,
        name: challenges.name,
        description: challenges.description,
        target: challenges.target,
        targetType: challenges.targetType,
        type: challenges.type,
        startDate: challenges.startDate,
        endDate: challenges.endDate,
      })
      .from(userChallenges)
      .innerJoin(challenges, eq(userChallenges.challengeId, challenges.id))
      .where(eq(userChallenges.userId, userId))
      .orderBy(userChallenges.joinedAt);

    // Calculate real-time progress for each challenge
    const enrichedChallenges = await Promise.all(
      userChallengeData.map(async (challenge) => {
        let actualProgress = challenge.currentProgress;

        // Calculate actual progress based on challenge type
        if (challenge.targetType === "days_logged") {
          // Count logs since challenge start date
          const startDate = challenge.startDate;
          const logCount = await db
            .select({ count: count() })
            .from(dailyLogs)
            .where(
              and(
                eq(dailyLogs.userId, userId),
                gte(dailyLogs.date, startDate)
              )
            );
          actualProgress = logCount[0]?.count || 0;
        } else if (challenge.type === "streak") {
          // For streak challenges, use the stored progress
          actualProgress = challenge.currentProgress || 0;
        } else if (challenge.targetType === "period_days") {
          // Count period logs since challenge start
          const startDate = challenge.startDate;
          const periodLogCount = await db
            .select({ count: count() })
            .from(dailyLogs)
            .where(
              and(
                eq(dailyLogs.userId, userId),
                gte(dailyLogs.date, startDate),
                eq(dailyLogs.isOnPeriod, true)
              )
            );
          actualProgress = periodLogCount[0]?.count || 0;
        }

        return {
          id: challenge.id,
          title: challenge.name,
          description: challenge.description || "",
          targetValue: challenge.target,
          currentProgress: actualProgress || 0,
          type: challenge.type,
          isCompleted: (actualProgress || 0) >= challenge.target,
        };
      })
    );

    return NextResponse.json(enrichedChallenges);
  } catch (error) {
    console.error("Error fetching user challenges:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
