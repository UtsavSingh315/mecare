import { db } from "@/lib/db";
import {
  dailyLogs,
  userChallenges,
  userBadges,
  challenges,
  badges,
  cycles,
} from "@/lib/db/schema";
import { eq, and, gte, desc, count } from "drizzle-orm";

export interface ChallengeProgress {
  challengeId: string;
  userId: string;
  currentProgress: number;
  targetValue: number;
  isCompleted: boolean;
  lastUpdated: string;
}

export class ChallengeEngine {
  static async checkAndUpdateChallenges(userId: string, actionType: string) {
    try {
      // Get all active challenges for the user
      const userActiveChallenges = await db
        .select({
          challengeId: userChallenges.challengeId,
          currentProgress: userChallenges.currentProgress,
          isCompleted: userChallenges.isCompleted,
          challenge: challenges,
        })
        .from(userChallenges)
        .innerJoin(challenges, eq(userChallenges.challengeId, challenges.id))
        .where(
          and(
            eq(userChallenges.userId, userId),
            eq(userChallenges.isCompleted, false)
          )
        );

      for (const userChallenge of userActiveChallenges) {
        const challenge = userChallenge.challenge;
        let newProgress = userChallenge.currentProgress;

        // Calculate progress based on challenge type
        switch (challenge.type) {
          case "daily_logging":
            newProgress = await this.calculateLoggingStreak(userId);
            break;
          case "period_tracking":
            newProgress = await this.calculatePeriodTrackingCount(userId);
            break;
          case "symptom_awareness":
            newProgress = await this.calculateSymptomLogsCount(userId);
            break;
          case "mood_tracking":
            newProgress = await this.calculateMoodLogsCount(userId);
            break;
          case "consistency":
            newProgress = await this.calculateConsistencyScore(userId);
            break;
          default:
            newProgress = userChallenge.currentProgress;
        }

        // Ensure newProgress is not null
        if (newProgress === null) newProgress = 0;

        // Update progress in database
        await db
          .update(userChallenges)
          .set({
            currentProgress: newProgress,
            isCompleted: newProgress >= challenge.target,
            completedAt: newProgress >= challenge.target ? new Date() : null,
          })
          .where(
            and(
              eq(userChallenges.userId, userId),
              eq(userChallenges.challengeId, challenge.id)
            )
          );

        // Award badge if challenge completed
        if (newProgress >= challenge.target && !userChallenge.isCompleted) {
          await this.awardBadge(userId, challenge.id); // Use challenge ID as badge reference
        }
      }
    } catch (error) {
      console.error("Error updating challenges:", error);
    }
  }

  private static async calculateLoggingStreak(userId: string): Promise<number> {
    // Get recent daily logs to calculate current streak
    const recentLogs = await db
      .select()
      .from(dailyLogs)
      .where(eq(dailyLogs.userId, userId))
      .orderBy(desc(dailyLogs.date))
      .limit(30);

    if (recentLogs.length === 0) return 0;

    // Calculate consecutive days from today backwards
    let streak = 0;
    const today = new Date();

    for (let i = 0; i < 30; i++) {
      const checkDate = new Date(today);
      checkDate.setDate(today.getDate() - i);
      const dateStr = checkDate.toISOString().split("T")[0];

      const hasLog = recentLogs.some((log) => log.date === dateStr);
      if (hasLog) {
        streak++;
      } else if (i > 0) {
        // Break streak if we find a gap (but not on first day)
        break;
      }
    }

    return streak;
  }

  private static async calculatePeriodTrackingCount(
    userId: string
  ): Promise<number> {
    // Count completed cycles (periods tracked)
    const cycleCount = await db
      .select({ count: count() })
      .from(cycles)
      .where(
        and(
          eq(cycles.userId, userId),
          eq(cycles.isActive, false) // Only completed cycles
        )
      );

    return cycleCount[0]?.count || 0;
  }

  private static async calculateSymptomLogsCount(
    userId: string
  ): Promise<number> {
    // Count days with symptom logs in last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const startDate = thirtyDaysAgo.toISOString().split("T")[0];

    const symptomLogs = await db
      .select({ count: count() })
      .from(dailyLogs)
      .where(and(eq(dailyLogs.userId, userId), gte(dailyLogs.date, startDate)));

    return symptomLogs[0]?.count || 0;
  }

  private static async calculateMoodLogsCount(userId: string): Promise<number> {
    // Count days with mood logs in last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const startDate = thirtyDaysAgo.toISOString().split("T")[0];

    const moodLogs = await db
      .select({ count: count() })
      .from(dailyLogs)
      .where(and(eq(dailyLogs.userId, userId), gte(dailyLogs.date, startDate)));

    return moodLogs[0]?.count || 0;
  }

  private static async calculateConsistencyScore(
    userId: string
  ): Promise<number> {
    // Calculate logging consistency percentage over last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const startDate = thirtyDaysAgo.toISOString().split("T")[0];

    const totalLogs = await db
      .select({ count: count() })
      .from(dailyLogs)
      .where(and(eq(dailyLogs.userId, userId), gte(dailyLogs.date, startDate)));

    const logCount = totalLogs[0]?.count || 0;
    return Math.round((logCount / 30) * 100);
  }

  private static async awardBadge(userId: string, badgeId: string) {
    try {
      // Check if user already has this badge
      const existingBadge = await db
        .select()
        .from(userBadges)
        .where(
          and(eq(userBadges.userId, userId), eq(userBadges.badgeId, badgeId))
        )
        .limit(1);

      if (existingBadge.length === 0) {
        // Award the badge
        await db.insert(userBadges).values({
          userId,
          badgeId,
          earnedAt: new Date(),
        });

        console.log(`Badge ${badgeId} awarded to user ${userId}`);
      }
    } catch (error) {
      console.error("Error awarding badge:", error);
    }
  }

  // Initialize challenges for new users
  static async initializeUserChallenges(userId: string) {
    try {
      // Get all available challenges
      const allChallenges = await db.select().from(challenges);

      // Create user challenge entries
      for (const challenge of allChallenges) {
        await db.insert(userChallenges).values({
          userId,
          challengeId: challenge.id,
          currentProgress: 0,
          isCompleted: false,
        });
      }
    } catch (error) {
      console.error("Error initializing user challenges:", error);
    }
  }
}
