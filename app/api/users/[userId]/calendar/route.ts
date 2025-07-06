import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";
import { getCalendarDataOptimized, getCachedUser } from "@/lib/db/performance-utils";
import { db } from "@/lib/db";
import { userProfiles, dailyLogs, periodDays, cycles } from "@/lib/db/schema";
import { eq, and, gte, lte, desc } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  let userId: string | undefined;
  try {
    const paramsResult = await params;
    userId = paramsResult.userId;
    const { searchParams } = new URL(request.url);
    const year = parseInt(
      searchParams.get("year") || new Date().getFullYear().toString()
    );
    const month = parseInt(
      searchParams.get("month") || (new Date().getMonth() + 1).toString()
    );

    // Helper function to format date safely without timezone issues
    const formatDateSafe = (date: Date): string => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };

    if (!userId) {
      return NextResponse.json(
        { error: "userId is required" },
        { status: 400 }
      );
    }

    // Use cached auth verification for better performance
    const authHeader = request.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const user = await getCachedUser(token);
    if (!user || user.id !== userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Use optimized parallel calendar data query
    const calendarData = await getCalendarDataOptimized(userId, year, month);
    const { userProfile, logs, periods, recentCycles } = calendarData;

    // Handle missing user profile by creating default values or creating the profile
    let configuredCycleLength = 28;
    let configuredPeriodLength = 5;

    if (!userProfile) {
      // Create a default profile if it doesn't exist
      try {
        const [newProfile] = await db
          .insert(userProfiles)
          .values({
            userId,
            averageCycleLength: 28,
            averagePeriodLength: 5,
            timezone: "UTC",
          })
          .returning();

        configuredCycleLength = newProfile.averageCycleLength;
        configuredPeriodLength = newProfile.averagePeriodLength;
      } catch (insertError) {
        // If insert fails, use defaults
        console.warn(
          "Failed to create user profile, using defaults:",
          insertError
        );
      }
    } else {
      configuredCycleLength = userProfile.averageCycleLength || 28;
      configuredPeriodLength = userProfile.averagePeriodLength || 5;
    }

    // Calculate monthly stats
    const periodDaysInMonth = periods.length;
    const loggedDaysInMonth = logs.length;
    const periodLogs = logs.filter((log) => log.isOnPeriod).length;

    // Calculate average pain and energy for the month
    const logsWithPain = logs.filter((log) => log.painLevel !== null);
    const logsWithEnergy = logs.filter((log) => log.energyLevel !== null);
    const avgPain =
      logsWithPain.length > 0
        ? logsWithPain.reduce((sum, log) => sum + (log.painLevel || 0), 0) /
          logsWithPain.length
        : 0;
    const avgEnergy =
      logsWithEnergy.length > 0
        ? logsWithEnergy.reduce((sum, log) => sum + (log.energyLevel || 0), 0) /
          logsWithEnergy.length
        : 0;

    // Predict next period with improved logic using user's configured cycle length
    let nextPeriodPrediction = null;
    let fertileWindowPrediction = null;
    let ovulationPrediction = null;

    if (recentCycles.length > 0) {
      // Use the user's configured cycle length as primary, fallback to historical average
      let cycleLength = configuredCycleLength;

      // If user wants to use historical data, calculate from recent cycles
      const validCycles = recentCycles.filter(
        (cycle) => cycle.cycleLength && cycle.cycleLength > 0
      );
      if (validCycles.length >= 2) {
        const historicalAverage =
          validCycles.reduce((sum, cycle) => sum + cycle.cycleLength!, 0) /
          validCycles.length;
        // Use a weighted average: 70% configured length, 30% historical average
        cycleLength = Math.round(
          configuredCycleLength * 0.7 + historicalAverage * 0.3
        );
      }

      // Get the most recent cycle
      const lastCycle = recentCycles[0];
      if (lastCycle && lastCycle.startDate) {
        const lastPeriodStart = new Date(lastCycle.startDate + "T00:00:00");

        // Check if the current cycle is still active
        const today = new Date();
        const daysSinceLastPeriod = Math.floor(
          (today.getTime() - lastPeriodStart.getTime()) / (1000 * 60 * 60 * 24)
        );

        if (lastCycle.isActive && daysSinceLastPeriod < cycleLength) {
          // Current cycle is still ongoing, predict next period
          const nextPeriodStart = new Date(lastPeriodStart);
          nextPeriodStart.setDate(lastPeriodStart.getDate() + cycleLength);
          nextPeriodPrediction = formatDateSafe(nextPeriodStart);

          // Predict ovulation (typically 14 days before next period)
          const ovulationDate = new Date(nextPeriodStart);
          ovulationDate.setDate(nextPeriodStart.getDate() - 14);
          ovulationPrediction = formatDateSafe(ovulationDate);

          // Predict fertile window (5 days before ovulation to 1 day after)
          const fertileStart = new Date(ovulationDate);
          fertileStart.setDate(ovulationDate.getDate() - 5);
          const fertileEnd = new Date(ovulationDate);
          fertileEnd.setDate(ovulationDate.getDate() + 1);
          fertileWindowPrediction = `${formatDateSafe(fertileStart)} to ${formatDateSafe(fertileEnd)}`;
        } else {
          // Cycle might be overdue or completed, calculate from last known start
          const nextPeriodStart = new Date(lastPeriodStart);
          nextPeriodStart.setDate(lastPeriodStart.getDate() + cycleLength);

          // If the predicted date is in the past, add another cycle
          while (nextPeriodStart < today) {
            nextPeriodStart.setDate(nextPeriodStart.getDate() + cycleLength);
          }

          nextPeriodPrediction = formatDateSafe(nextPeriodStart);

          // Calculate ovulation and fertile window
          const ovulationDate = new Date(nextPeriodStart);
          ovulationDate.setDate(nextPeriodStart.getDate() - 14);
          if (ovulationDate > today) {
            ovulationPrediction = formatDateSafe(ovulationDate);

            const fertileStart = new Date(ovulationDate);
            fertileStart.setDate(ovulationDate.getDate() - 5);
            const fertileEnd = new Date(ovulationDate);
            fertileEnd.setDate(ovulationDate.getDate() + 1);
            fertileWindowPrediction = `${formatDateSafe(fertileStart)} to ${formatDateSafe(fertileEnd)}`;
          }
        }
      }
    } else {
      // No cycle history, use configured cycle length from last known period start
      if (userProfile?.lastPeriodStart) {
        const lastPeriodStart = new Date(
          userProfile.lastPeriodStart + "T00:00:00"
        );
        const today = new Date();

        const nextPeriodStart = new Date(lastPeriodStart);
        nextPeriodStart.setDate(
          lastPeriodStart.getDate() + configuredCycleLength
        );

        // If the predicted date is in the past, add cycles until future
        while (nextPeriodStart < today) {
          nextPeriodStart.setDate(
            nextPeriodStart.getDate() + configuredCycleLength
          );
        }

        nextPeriodPrediction = formatDateSafe(nextPeriodStart);

        // Calculate ovulation and fertile window
        const ovulationDate = new Date(nextPeriodStart);
        ovulationDate.setDate(nextPeriodStart.getDate() - 14);
        if (ovulationDate > today) {
          ovulationPrediction = formatDateSafe(ovulationDate);

          const fertileStart = new Date(ovulationDate);
          fertileStart.setDate(ovulationDate.getDate() - 5);
          const fertileEnd = new Date(ovulationDate);
          fertileEnd.setDate(ovulationDate.getDate() + 1);
          fertileWindowPrediction = `${formatDateSafe(fertileStart)} to ${formatDateSafe(fertileEnd)}`;
        }
      }
    }

    // Format data for calendar
    const responseData = {
      year,
      month,
      logs: logs.map((log) => ({
        date: log.date,
        mood: log.mood,
        painLevel: log.painLevel,
        energyLevel: log.energyLevel,
        isOnPeriod: log.isOnPeriod,
        notes: log.notes,
      })),
      periodDays: periods.map((period) => ({
        date: period.date,
        flowIntensity: period.flowIntensity,
        notes: period.notes,
      })),
      monthlyStats: {
        periodDays: periodDaysInMonth,
        loggedDays: loggedDaysInMonth,
        avgPain: Math.round(avgPain * 10) / 10,
        avgEnergy: Math.round(avgEnergy * 10) / 10,
      },
      predictions: {
        nextPeriod: nextPeriodPrediction,
        fertileWindow: fertileWindowPrediction,
        ovulation: ovulationPrediction,
        expectedPeriodLength: configuredPeriodLength,
      },
      userSettings: {
        configuredCycleLength: configuredCycleLength,
        configuredPeriodLength: configuredPeriodLength,
      },
    };

    return NextResponse.json(responseData);
  } catch (error) {
    console.error("Error fetching calendar data:", error);
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
