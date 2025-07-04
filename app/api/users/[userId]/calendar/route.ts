import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";
import { db } from "@/lib/db";
import { dailyLogs, cycles, periodDays, userProfiles } from "@/lib/db/schema";
import { eq, and, gte, lte, desc } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params;
    const { searchParams } = new URL(request.url);
    const year = parseInt(
      searchParams.get("year") || new Date().getFullYear().toString()
    );
    const month = parseInt(
      searchParams.get("month") || (new Date().getMonth() + 1).toString()
    );

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

    // Get start and end dates for the month
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);
    const startDateStr = startDate.toISOString().split("T")[0];
    const endDateStr = endDate.toISOString().split("T")[0];

    // Get user profile for cycle preferences
    const userProfile = await db
      .select()
      .from(userProfiles)
      .where(eq(userProfiles.userId, userId))
      .limit(1);

    const configuredCycleLength = userProfile[0]?.averageCycleLength || 28;
    const configuredPeriodLength = userProfile[0]?.averagePeriodLength || 5;

    // Get daily logs for the month
    const logs = await db
      .select()
      .from(dailyLogs)
      .where(
        and(
          eq(dailyLogs.userId, userId),
          gte(dailyLogs.date, startDateStr),
          lte(dailyLogs.date, endDateStr)
        )
      )
      .orderBy(dailyLogs.date);

    // Get period days for the month
    const periods = await db
      .select()
      .from(periodDays)
      .where(
        and(
          eq(periodDays.userId, userId),
          gte(periodDays.date, startDateStr),
          lte(periodDays.date, endDateStr)
        )
      )
      .orderBy(periodDays.date);

    // Get recent cycles to predict next period
    const recentCycles = await db
      .select()
      .from(cycles)
      .where(eq(cycles.userId, userId))
      .orderBy(desc(cycles.startDate))
      .limit(3);

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
          nextPeriodPrediction = nextPeriodStart.toISOString().split("T")[0];

          // Predict ovulation (typically 14 days before next period)
          const ovulationDate = new Date(nextPeriodStart);
          ovulationDate.setDate(nextPeriodStart.getDate() - 14);
          ovulationPrediction = ovulationDate.toISOString().split("T")[0];

          // Predict fertile window (5 days before ovulation to 1 day after)
          const fertileStart = new Date(ovulationDate);
          fertileStart.setDate(ovulationDate.getDate() - 5);
          const fertileEnd = new Date(ovulationDate);
          fertileEnd.setDate(ovulationDate.getDate() + 1);
          fertileWindowPrediction = `${
            fertileStart.toISOString().split("T")[0]
          } to ${fertileEnd.toISOString().split("T")[0]}`;
        } else {
          // Cycle might be overdue or completed, calculate from last known start
          const nextPeriodStart = new Date(lastPeriodStart);
          nextPeriodStart.setDate(lastPeriodStart.getDate() + cycleLength);

          // If the predicted date is in the past, add another cycle
          while (nextPeriodStart < today) {
            nextPeriodStart.setDate(nextPeriodStart.getDate() + cycleLength);
          }

          nextPeriodPrediction = nextPeriodStart.toISOString().split("T")[0];

          // Calculate ovulation and fertile window
          const ovulationDate = new Date(nextPeriodStart);
          ovulationDate.setDate(nextPeriodStart.getDate() - 14);
          if (ovulationDate > today) {
            ovulationPrediction = ovulationDate.toISOString().split("T")[0];

            const fertileStart = new Date(ovulationDate);
            fertileStart.setDate(ovulationDate.getDate() - 5);
            const fertileEnd = new Date(ovulationDate);
            fertileEnd.setDate(ovulationDate.getDate() + 1);
            fertileWindowPrediction = `${
              fertileStart.toISOString().split("T")[0]
            } to ${fertileEnd.toISOString().split("T")[0]}`;
          }
        }
      }
    } else {
      // No cycle history, use configured cycle length from last known period start
      if (userProfile[0]?.lastPeriodStart) {
        const lastPeriodStart = new Date(
          userProfile[0].lastPeriodStart + "T00:00:00"
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

        nextPeriodPrediction = nextPeriodStart.toISOString().split("T")[0];

        // Calculate ovulation and fertile window
        const ovulationDate = new Date(nextPeriodStart);
        ovulationDate.setDate(nextPeriodStart.getDate() - 14);
        if (ovulationDate > today) {
          ovulationPrediction = ovulationDate.toISOString().split("T")[0];

          const fertileStart = new Date(ovulationDate);
          fertileStart.setDate(ovulationDate.getDate() - 5);
          const fertileEnd = new Date(ovulationDate);
          fertileEnd.setDate(ovulationDate.getDate() + 1);
          fertileWindowPrediction = `${
            fertileStart.toISOString().split("T")[0]
          } to ${fertileEnd.toISOString().split("T")[0]}`;
        }
      }
    }

    // Format data for calendar
    const calendarData = {
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

    return NextResponse.json(calendarData);
  } catch (error) {
    console.error("Error fetching calendar data:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
