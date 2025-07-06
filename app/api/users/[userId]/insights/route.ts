import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  dailyLogs,
  dailyLogSymptoms,
  symptoms,
  cycles,
  userBadges,
} from "@/lib/db/schema";
import { eq, and, gte, lte, count, avg, desc } from "drizzle-orm";

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

    // Get the last 3 months of data for analysis
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
    
    // Timezone-safe date formatting
    const formatDateSafe = (date: Date): string => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };
    
    const startDate = formatDateSafe(threeMonthsAgo);

    // Get user's daily logs
    const userLogs = await db
      .select()
      .from(dailyLogs)
      .where(and(eq(dailyLogs.userId, userId), gte(dailyLogs.date, startDate)))
      .orderBy(desc(dailyLogs.date));

    // Get symptom data
    const symptomData = await db
      .select({
        symptomName: symptoms.name,
        count: count(dailyLogSymptoms.id),
      })
      .from(dailyLogSymptoms)
      .innerJoin(symptoms, eq(dailyLogSymptoms.symptomId, symptoms.id))
      .innerJoin(dailyLogs, eq(dailyLogSymptoms.dailyLogId, dailyLogs.id))
      .where(and(eq(dailyLogs.userId, userId), gte(dailyLogs.date, startDate)))
      .groupBy(symptoms.name)
      .orderBy(desc(count(dailyLogSymptoms.id)));

    // Calculate mood frequency
    const moodCounts: Record<string, number> = {};
    userLogs.forEach((log) => {
      if (log.mood) {
        moodCounts[log.mood] = (moodCounts[log.mood] || 0) + 1;
      }
    });

    // Calculate averages
    const periodsLogged = userLogs.filter((log) => log.isOnPeriod).length;
    const totalPainLevels = userLogs.filter((log) => log.painLevel !== null);
    const totalEnergyLevels = userLogs.filter(
      (log) => log.energyLevel !== null
    );

    const avgPainLevel =
      totalPainLevels.length > 0
        ? totalPainLevels.reduce((sum, log) => sum + (log.painLevel || 0), 0) /
          totalPainLevels.length
        : 0;

    const avgEnergyLevel =
      totalEnergyLevels.length > 0
        ? totalEnergyLevels.reduce(
            (sum, log) => sum + (log.energyLevel || 0),
            0
          ) / totalEnergyLevels.length
        : 5;

    // Get user badges
    const badges = await db
      .select()
      .from(userBadges)
      .where(eq(userBadges.userId, userId));

    // Calculate cycle consistency (simplified - can be enhanced)
    const cycleConsistency =
      userLogs.length > 0 ? Math.min(95, (userLogs.length / 90) * 100) : 0;

    const insights = {
      totalLogged: userLogs.length,
      periodsLogged,
      avgPainLevel: Math.round(avgPainLevel * 10) / 10,
      avgEnergyLevel: Math.round(avgEnergyLevel * 10) / 10,
      cycleConsistency: Math.round(cycleConsistency),
      badgesEarned: badges.length,
      symptoms: symptomData.map((s) => ({
        name: s.symptomName,
        frequency: Number(s.count),
      })),
      moods: Object.entries(moodCounts)
        .map(([mood, count]) => ({
          name: mood.charAt(0).toUpperCase() + mood.slice(1),
          frequency: count,
        }))
        .sort((a, b) => b.frequency - a.frequency),
      monthlyTrends: {
        totalLogs: userLogs.length,
        periodDays: periodsLogged,
        avgPain: avgPainLevel,
        avgEnergy: avgEnergyLevel,
      },
    };

    console.log("Insights response:", {
      totalLogged: insights.totalLogged,
      symptomsCount: insights.symptoms.length,
      moodsCount: insights.moods.length,
      symptoms: insights.symptoms,
      moods: insights.moods,
    });

    return NextResponse.json(insights);
  } catch (error) {
    console.error("Error fetching user insights:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
