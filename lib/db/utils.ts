import { db } from "./index";
import {
  dailyLogs,
  cycles,
  periodDays,
  streaks,
  userBadges,
  badges,
  symptoms,
  dailyLogSymptoms,
  cyclePredictions,
  userInsights,
  users,
  userProfiles,
} from "./schema";
import { eq, and, gte, lte, desc, asc, count, avg, sql } from "drizzle-orm";

// ==================== USER PROFILE UTILITIES ====================

export async function getUserProfile(userId: string) {
  const result = await db
    .select()
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);
  return result[0] || null;
}

// ==================== DAILY LOG UTILITIES ====================

export async function createDailyLog(
  userId: string,
  logData: {
    date: string;
    mood?: string;
    painLevel?: number;
    energyLevel?: number;
    waterIntake?: number;
    sleepHours?: number;
    exerciseMinutes?: number;
    weight?: number;
    notes?: string;
    isOnPeriod?: boolean;
    symptoms?: string[];
  }
) {
  // Use transaction to ensure all operations succeed or fail together
  return await db.transaction(async (tx) => {
    // Insert daily log
    const [dailyLog] = await tx
      .insert(dailyLogs)
      .values({
        userId,
        date: logData.date,
        mood: logData.mood,
        painLevel: logData.painLevel,
        energyLevel: logData.energyLevel,
        waterIntake: logData.waterIntake,
        sleepHours: logData.sleepHours?.toString(),
        exerciseMinutes: logData.exerciseMinutes,
        weight: logData.weight?.toString(),
        notes: logData.notes,
        isOnPeriod: logData.isOnPeriod,
      })
      .returning();

    // Insert symptoms if provided
    if (logData.symptoms && logData.symptoms.length > 0) {
      // Find or create symptom records for each symptom name
      const symptomIds: string[] = [];
      
      for (const symptomName of logData.symptoms) {
        // First, try to find existing symptom
        const existingSymptom = await tx
          .select()
          .from(symptoms)
          .where(eq(symptoms.name, symptomName))
          .limit(1);
        
        if (existingSymptom.length > 0) {
          symptomIds.push(existingSymptom[0].id);
        } else {
          // Create new symptom if it doesn't exist
          const [newSymptom] = await tx
            .insert(symptoms)
            .values({
              name: symptomName,
              category: 'physical', // default category
              isDefault: false,
            })
            .returning();
          symptomIds.push(newSymptom.id);
        }
      }
      
      // Now insert the symptom entries with proper UUIDs
      if (symptomIds.length > 0) {
        const symptomEntries = symptomIds.map((symptomId) => ({
          dailyLogId: dailyLog.id,
          symptomId,
        }));
        await tx.insert(dailyLogSymptoms).values(symptomEntries);
      }
    }

    // Handle period tracking and cycle management
    if (logData.isOnPeriod) {
      // Check if this is the start of a new period
      const yesterday = new Date(logData.date);
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];
      
      // Check if yesterday was NOT a period day
      const yesterdayLog = await tx
        .select()
        .from(dailyLogs)
        .where(and(
          eq(dailyLogs.userId, userId),
          eq(dailyLogs.date, yesterdayStr)
        ))
        .limit(1);
      
      // Also check for long gaps - if the last period log was more than 45 days ago, this is definitely a new period
      const last45Days = new Date(logData.date);
      last45Days.setDate(last45Days.getDate() - 45);
      const last45DaysStr = last45Days.toISOString().split('T')[0];
      
      const recentPeriodLogs = await tx
        .select()
        .from(dailyLogs)
        .where(and(
          eq(dailyLogs.userId, userId),
          gte(dailyLogs.date, last45DaysStr),
          lte(dailyLogs.date, yesterdayStr),
          eq(dailyLogs.isOnPeriod, true)
        ))
        .limit(1);
      
      const isNewPeriodStart = !yesterdayLog[0]?.isOnPeriod || recentPeriodLogs.length === 0;
      
      if (isNewPeriodStart) {
        // End any active cycles - calculate cycle length first
        const endDate = logData.date;
        
        // Get active cycles first to calculate length
        const activeCycles = await tx
          .select()
          .from(cycles)
          .where(and(eq(cycles.userId, userId), eq(cycles.isActive, true)));
        
        // Update each active cycle with calculated length
        for (const cycle of activeCycles) {
          const startDate = new Date(cycle.startDate + "T00:00:00");
          const currentEndDate = new Date(endDate + "T00:00:00");
          const cycleLength = Math.ceil((currentEndDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
          
          await tx
            .update(cycles)
            .set({ 
              isActive: false,
              endDate: endDate,
              cycleLength: cycleLength
            })
            .where(eq(cycles.id, cycle.id));
        }

        // Start new cycle
        await tx.insert(cycles).values({
          userId,
          startDate: logData.date,
          isActive: true,
          notes: `Period started on ${logData.date}`
        });

        // Update user profile with new period start date
        // First check if profile exists, if not create it
        const existingProfile = await tx
          .select()
          .from(userProfiles)
          .where(eq(userProfiles.userId, userId))
          .limit(1);

        if (existingProfile.length === 0) {
          // Create user profile if it doesn't exist
          await tx.insert(userProfiles).values({
            userId,
            averageCycleLength: 28,
            averagePeriodLength: 5,
            lastPeriodStart: logData.date,
            timezone: 'UTC'
          });
        } else {
          // Update existing profile
          await tx
            .update(userProfiles)
            .set({ lastPeriodStart: logData.date })
            .where(eq(userProfiles.userId, userId));
        }
      }
      
      // Create period day entry for any period (whether new cycle or continuing)
      await tx.insert(periodDays).values({
        userId,
        date: logData.date,
        flowIntensity: 'medium', // Default, could be made configurable
        cycleId: null // Will be updated when we have proper cycle management
      });
    }

    // Update streaks (keep this outside transaction since it's separate functionality)
    await updateUserStreaks(userId, logData.date);

    return dailyLog;
  });
}

export async function getUserDailyLogs(
  userId: string,
  startDate?: string,
  endDate?: string
) {
  let query = db.query.dailyLogs.findMany({
    where: eq(dailyLogs.userId, userId),
    with: {
      symptoms: {
        with: {
          symptom: true,
        },
      },
    },
    orderBy: desc(dailyLogs.date),
  });

  if (startDate && endDate) {
    query = db.query.dailyLogs.findMany({
      where: and(
        eq(dailyLogs.userId, userId),
        gte(dailyLogs.date, startDate),
        lte(dailyLogs.date, endDate)
      ),
      with: {
        symptoms: {
          with: {
            symptom: true,
          },
        },
      },
      orderBy: desc(dailyLogs.date),
    });
  }

  return await query;
}

export async function getDailyLogByDate(userId: string, date: string) {
  return await db.query.dailyLogs.findFirst({
    where: and(eq(dailyLogs.userId, userId), eq(dailyLogs.date, date)),
    with: {
      symptoms: {
        with: {
          symptom: true,
        },
      },
    },
  });
}

// ==================== CYCLE UTILITIES ====================

export async function startNewCycle(userId: string, startDate: string) {
  // End any active cycles
  await db
    .update(cycles)
    .set({ isActive: false })
    .where(and(eq(cycles.userId, userId), eq(cycles.isActive, true)));

  // Create new cycle
  const [newCycle] = await db
    .insert(cycles)
    .values({
      userId,
      startDate,
      isActive: true,
    })
    .returning();

  return newCycle;
}

export async function getUserActiveCycle(userId: string) {
  return await db.query.cycles.findFirst({
    where: and(eq(cycles.userId, userId), eq(cycles.isActive, true)),
  });
}

export async function getUserCycleHistory(userId: string, limit = 12) {
  return await db.query.cycles.findMany({
    where: eq(cycles.userId, userId),
    orderBy: desc(cycles.startDate),
    limit,
  });
}

// ==================== STREAK UTILITIES ====================

export async function updateUserStreaks(userId: string, logDate: string) {
  const streakTypes = ["logging", "water", "exercise"];

  for (const type of streakTypes) {
    // Get or create streak record
    let [streak] = await db
      .select()
      .from(streaks)
      .where(and(eq(streaks.userId, userId), eq(streaks.type, type)));

    if (!streak) {
      [streak] = await db
        .insert(streaks)
        .values({
          userId,
          type,
          currentStreak: 1,
          longestStreak: 1,
          lastActivityDate: logDate,
        })
        .returning();
      continue;
    }

    const lastDate = new Date(streak.lastActivityDate || "");
    const currentDate = new Date(logDate);
    const daysDiff = Math.floor(
      (currentDate.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24)
    );

    let newCurrentStreak = streak.currentStreak || 0;
    let newLongestStreak = streak.longestStreak || 0;

    if (daysDiff === 1) {
      // Consecutive day - increment streak
      newCurrentStreak += 1;
      newLongestStreak = Math.max(newLongestStreak, newCurrentStreak);
    } else if (daysDiff > 1) {
      // Streak broken - reset to 1
      newCurrentStreak = 1;
    }
    // If daysDiff === 0, it's the same day, don't change streak

    await db
      .update(streaks)
      .set({
        currentStreak: newCurrentStreak,
        longestStreak: newLongestStreak,
        lastActivityDate: logDate,
      })
      .where(eq(streaks.id, streak.id));
  }
}

export async function getUserStreaks(userId: string) {
  return await db.select().from(streaks).where(eq(streaks.userId, userId));
}

// ==================== BADGE UTILITIES ====================

export async function checkAndAwardBadges(userId: string) {
  // Get user's current badges
  const userCurrentBadges = await db
    .select()
    .from(userBadges)
    .where(eq(userBadges.userId, userId));

  const currentBadgeIds = userCurrentBadges.map((ub) => ub.badgeId);

  // Get all available badges
  const availableBadges = await db
    .select()
    .from(badges)
    .where(eq(badges.isActive, true));

  const newlyEarnedBadges = [];

  for (const badge of availableBadges) {
    if (currentBadgeIds.includes(badge.id)) continue;

    const earned = await checkBadgeRequirement(userId, badge);
    if (earned) {
      await db.insert(userBadges).values({
        userId,
        badgeId: badge.id,
      });
      newlyEarnedBadges.push(badge);
    }
  }

  return newlyEarnedBadges;
}

async function checkBadgeRequirement(
  userId: string,
  badge: any
): Promise<boolean> {
  const requirement = badge.requirement;

  switch (requirement.type) {
    case "daily_logs_count":
      const logCount = await db
        .select({ count: count() })
        .from(dailyLogs)
        .where(eq(dailyLogs.userId, userId));
      return logCount[0].count >= requirement.value;

    case "consecutive_logs":
      const streak = await db
        .select()
        .from(streaks)
        .where(and(eq(streaks.userId, userId), eq(streaks.type, "logging")));
      return (streak[0]?.longestStreak || 0) >= requirement.value;

    case "total_logs":
      const totalLogs = await db
        .select({ count: count() })
        .from(dailyLogs)
        .where(eq(dailyLogs.userId, userId));
      return totalLogs[0].count >= requirement.value;

    // Add more badge requirement checks as needed
    default:
      return false;
  }
}

export async function getUserBadges(userId: string) {
  return await db.query.userBadges.findMany({
    where: eq(userBadges.userId, userId),
    with: {
      badge: true,
    },
    orderBy: desc(userBadges.earnedAt),
  });
}

// ==================== ANALYTICS UTILITIES ====================

export async function generateUserInsights(
  userId: string,
  month: number,
  year: number
) {
  const startDate = `${year}-${month.toString().padStart(2, "0")}-01`;
  const endDate = `${year}-${month.toString().padStart(2, "0")}-31`;

  // Get daily logs for the month
  const logs = await getUserDailyLogs(userId, startDate, endDate);

  if (logs.length === 0) {
    return null;
  }

  // Calculate insights
  const totalDaysLogged = logs.length;
  const averageMoodScore = calculateAverageMoodScore(logs);
  const averagePainLevel =
    logs.reduce((sum, log) => sum + (log.painLevel || 0), 0) / logs.length;
  const averageEnergyLevel =
    logs.reduce((sum, log) => sum + (log.energyLevel || 0), 0) / logs.length;
  const averageWaterIntake =
    logs.reduce((sum, log) => sum + (log.waterIntake || 0), 0) / logs.length;
  const periodDaysCount = logs.filter((log) => log.isOnPeriod).length;

  // Get symptom frequencies
  const symptomFrequencies = calculateSymptomFrequencies(logs);
  const moodDistribution = calculateMoodDistribution(logs);

  // Calculate cycle consistency (this would be more complex in reality)
  const cycleConsistency = 85; // Placeholder

  const insights = {
    userId,
    month,
    year,
    totalDaysLogged,
    averageMoodScore: averageMoodScore.toString(),
    averagePainLevel: averagePainLevel.toString(),
    averageEnergyLevel: averageEnergyLevel.toString(),
    averageWaterIntake: averageWaterIntake.toString(),
    mostCommonSymptoms: symptomFrequencies,
    moodDistribution,
    periodDaysCount,
    cycleConsistency: cycleConsistency.toString(),
  };

  // Insert or update insights
  await db
    .insert(userInsights)
    .values(insights)
    .onConflictDoUpdate({
      target: [userInsights.userId, userInsights.month, userInsights.year],
      set: insights,
    });

  return insights;
}

function calculateAverageMoodScore(logs: any[]): number {
  const moodScores: Record<string, number> = {
    happy: 5,
    content: 4,
    neutral: 3,
    sad: 2,
    angry: 1,
    anxious: 1,
  };

  const validMoods = logs.filter((log) => log.mood && moodScores[log.mood]);
  if (validMoods.length === 0) return 0;

  const totalScore = validMoods.reduce(
    (sum, log) => sum + moodScores[log.mood],
    0
  );
  return totalScore / validMoods.length;
}

function calculateSymptomFrequencies(logs: any[]): any {
  const symptomCounts: Record<string, number> = {};
  const totalLogs = logs.length;

  logs.forEach((log) => {
    log.symptoms?.forEach((symptomEntry: any) => {
      const symptomName = symptomEntry.symptom.name;
      symptomCounts[symptomName] = (symptomCounts[symptomName] || 0) + 1;
    });
  });

  // Convert to percentages
  const symptomFrequencies: Record<string, number> = {};
  Object.entries(symptomCounts).forEach(([symptom, count]) => {
    symptomFrequencies[symptom] = Math.round((count / totalLogs) * 100);
  });

  return symptomFrequencies;
}

function calculateMoodDistribution(logs: any[]): any {
  const moodCounts: Record<string, number> = {};
  const totalLogs = logs.length;

  logs.forEach((log) => {
    if (log.mood) {
      moodCounts[log.mood] = (moodCounts[log.mood] || 0) + 1;
    }
  });

  // Convert to percentages
  const moodDistribution: Record<string, number> = {};
  Object.entries(moodCounts).forEach(([mood, count]) => {
    moodDistribution[mood] = Math.round((count / totalLogs) * 100);
  });

  return moodDistribution;
}

// ==================== PREDICTION UTILITIES ====================

export async function generateCyclePredictions(userId: string) {
  // Get user's cycle history
  const recentCycles = await getUserCycleHistory(userId, 6);

  if (recentCycles.length < 2) {
    return null; // Need at least 2 cycles for prediction
  }

  // Calculate average cycle length
  const completedCycles = recentCycles.filter((cycle) => cycle.endDate);
  const averageCycleLength =
    completedCycles.reduce((sum, cycle) => {
      const cycleLength = cycle.cycleLength || 28;
      return sum + cycleLength;
    }, 0) / completedCycles.length || 28;

  // Get the last cycle start date
  const lastCycleStart = new Date(recentCycles[0].startDate);

  // Predict next period
  const predictedPeriodStart = new Date(lastCycleStart);
  predictedPeriodStart.setDate(
    predictedPeriodStart.getDate() + averageCycleLength
  );

  const predictedPeriodEnd = new Date(predictedPeriodStart);
  predictedPeriodEnd.setDate(predictedPeriodEnd.getDate() + 5); // Average period length

  // Predict ovulation (typically 14 days before period)
  const predictedOvulation = new Date(predictedPeriodStart);
  predictedOvulation.setDate(predictedOvulation.getDate() - 14);

  // Predict fertility window (5 days before and 1 day after ovulation)
  const fertilityWindowStart = new Date(predictedOvulation);
  fertilityWindowStart.setDate(fertilityWindowStart.getDate() - 5);

  const fertilityWindowEnd = new Date(predictedOvulation);
  fertilityWindowEnd.setDate(fertilityWindowEnd.getDate() + 1);

  const prediction = {
    userId,
    predictedPeriodStart: predictedPeriodStart.toISOString().split("T")[0],
    predictedPeriodEnd: predictedPeriodEnd.toISOString().split("T")[0],
    predictedOvulation: predictedOvulation.toISOString().split("T")[0],
    fertilityWindowStart: fertilityWindowStart.toISOString().split("T")[0],
    fertilityWindowEnd: fertilityWindowEnd.toISOString().split("T")[0],
    confidence: (completedCycles.length >= 3 ? 85 : 70).toString(), // Higher confidence with more data
  };

  // Insert prediction
  await db.insert(cyclePredictions).values(prediction);

  return prediction;
}

export async function getLatestPrediction(userId: string) {
  return await db.query.cyclePredictions.findFirst({
    where: eq(cyclePredictions.userId, userId),
    orderBy: desc(cyclePredictions.createdAt),
  });
}

export async function getTotalDailyLogsCount(userId: string): Promise<number> {
  const result = await db
    .select({ count: count() })
    .from(dailyLogs)
    .where(eq(dailyLogs.userId, userId));
  
  return result[0]?.count || 0;
}

export async function getCurrentCycleDay(userId: string): Promise<number> {
  // Get the most recent active cycle
  const activeCycle = await db
    .select()
    .from(cycles)
    .where(and(eq(cycles.userId, userId), eq(cycles.isActive, true)))
    .limit(1);
  
  if (activeCycle.length === 0) {
    return 1; // Default to day 1 if no active cycle
  }
  
  const cycleStart = new Date(activeCycle[0].startDate + "T00:00:00");
  const today = new Date();
  const daysDiff = Math.floor((today.getTime() - cycleStart.getTime()) / (1000 * 60 * 60 * 24));
  
  return Math.max(1, daysDiff + 1); // Ensure at least day 1
}
