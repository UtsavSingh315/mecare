import { NotificationService } from "./service";
import { db } from "@/lib/db";
import { dailyLogs, periodDays, userProfiles, reminderSettings, notifications } from "@/lib/db/schema";
import { eq, and, desc, gte, lte } from "drizzle-orm";

export class NotificationScheduler {
  // Check and create period predictions notifications
  static async checkPeriodReminders() {
    try {
      console.log("Checking period reminders...");
      
      // Get all users with active reminder settings for period notifications
      const periodReminders = await db
        .select({
          userId: reminderSettings.userId,
          isEnabled: reminderSettings.isEnabled,
        })
        .from(reminderSettings)
        .where(and(
          eq(reminderSettings.type, "period"),
          eq(reminderSettings.isEnabled, true)
        ));

      for (const reminder of periodReminders) {
        await this.createPeriodReminderForUser(reminder.userId);
      }
    } catch (error) {
      console.error("Error checking period reminders:", error);
    }
  }

  // Create period reminder for specific user
  static async createPeriodReminderForUser(userId: string) {
    try {
      // Get user profile
      const userProfile = await db
        .select()
        .from(userProfiles)
        .where(eq(userProfiles.userId, userId))
        .limit(1);

      if (userProfile.length === 0) return;

      const profile = userProfile[0];
      const cycleLength = profile.averageCycleLength || 28;

      // Get the last period start date
      const lastPeriod = await db
        .select()
        .from(periodDays)
        .where(eq(periodDays.userId, userId))
        .orderBy(desc(periodDays.date))
        .limit(1);

      if (lastPeriod.length === 0) return;

      const lastPeriodDate = new Date(lastPeriod[0].date);
      const today = new Date();
      const daysSinceLastPeriod = Math.floor(
        (today.getTime() - lastPeriodDate.getTime()) / (1000 * 60 * 60 * 24)
      );

      // Calculate days until next expected period
      const daysUntilNext = cycleLength - daysSinceLastPeriod;

      // Send reminders at 3 days and 1 day before expected period
      if (daysUntilNext === 3 || daysUntilNext === 1) {
        const enabled = await NotificationService.isNotificationEnabled(userId, "period");
        if (enabled) {
          await NotificationService.createPeriodReminder(userId, daysUntilNext);
          console.log(`Created period reminder for user ${userId}: ${daysUntilNext} days`);
        }
      }
    } catch (error) {
      console.error(`Error creating period reminder for user ${userId}:`, error);
    }
  }

  // Check and create log reminders with time consideration
  static async checkLogReminders() {
    try {
      console.log("Checking log reminders...");
      
      // Get all users with active log reminder settings
      const logReminders = await db
        .select({
          userId: reminderSettings.userId,
          time: reminderSettings.time,
        })
        .from(reminderSettings)
        .where(and(
          eq(reminderSettings.type, "log"),
          eq(reminderSettings.isEnabled, true)
        ));

      const now = new Date();
      const currentHour = now.getHours();
      const currentMinute = now.getMinutes();

      for (const reminder of logReminders) {
        // Check if it's time to send the reminder
        if (reminder.time) {
          const [hour, minute] = reminder.time.split(':').map(Number);
          
          // Send reminder if we're at or past the scheduled time but within the same hour
          // This allows for more flexible cron job timing
          if (currentHour === hour && currentMinute >= minute) {
            await this.createLogReminderForUser(reminder.userId);
          } else if (currentHour > hour) {
            // Also send if we're past the scheduled hour (in case cron job is delayed)
            await this.createLogReminderForUser(reminder.userId);
          }
        } else {
          // Default time if no time is set (8 PM)
          if (currentHour >= 20) {
            await this.createLogReminderForUser(reminder.userId);
          }
        }
      }
    } catch (error) {
      console.error("Error checking log reminders:", error);
    }
  }

  // Create log reminder for specific user
  static async createLogReminderForUser(userId: string) {
    try {
      const today = new Date().toISOString().split('T')[0];
      
      // Check if user has already logged today
      const todayLog = await db
        .select()
        .from(dailyLogs)
        .where(and(
          eq(dailyLogs.userId, userId),
          eq(dailyLogs.date, today)
        ))
        .limit(1);

      // Only send reminder if they haven't logged today
      if (todayLog.length === 0) {
        // Check if we've already sent a log reminder today
        const todayStart = new Date(today + 'T00:00:00.000Z');
        const todayEnd = new Date(today + 'T23:59:59.999Z');
        
        const existingReminder = await db
          .select()
          .from(notifications)
          .where(and(
            eq(notifications.userId, userId),
            eq(notifications.type, "log"),
            gte(notifications.createdAt, todayStart),
            lte(notifications.createdAt, todayEnd)
          ))
          .limit(1);

        // Only create reminder if we haven't sent one today
        if (existingReminder.length === 0) {
          const enabled = await NotificationService.isNotificationEnabled(userId, "log");
          if (enabled) {
            await NotificationService.createLogReminder(userId);
            console.log(`Created log reminder for user ${userId}`);
          }
        } else {
          console.log(`Log reminder already sent today for user ${userId}`);
        }
      } else {
        console.log(`User ${userId} has already logged today`);
      }
    } catch (error) {
      console.error(`Error creating log reminder for user ${userId}:`, error);
    }
  }

  // Check for patterns and create insights
  static async checkAndCreateInsights() {
    try {
      console.log("Checking for insights...");
      
      // Get all users for pattern analysis
      const users = await db
        .select({ id: userProfiles.userId })
        .from(userProfiles);

      for (const user of users) {
        await this.createInsightsForUser(user.id);
      }
    } catch (error) {
      console.error("Error checking insights:", error);
    }
  }

  // Create insights for specific user
  static async createInsightsForUser(userId: string) {
    try {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const thirtyDaysAgoStr = thirtyDaysAgo.toISOString().split('T')[0];

      // Get recent logs for analysis
      const recentLogs = await db
        .select()
        .from(dailyLogs)
        .where(and(
          eq(dailyLogs.userId, userId),
          gte(dailyLogs.date, thirtyDaysAgoStr)
        ))
        .orderBy(desc(dailyLogs.date));

      if (recentLogs.length < 7) return; // Need at least a week of data

      // Analyze pain patterns
      const painLogs = recentLogs.filter(log => log.painLevel !== null && log.painLevel > 6);
      if (painLogs.length >= 3) {
        // Check if we haven't already sent this insight recently
        const insight = `You've experienced high pain levels (${painLogs.length} times) in the past month. Consider tracking triggers and discussing with your healthcare provider.`;
        
        const enabled = await NotificationService.isNotificationEnabled(userId, "insight");
        if (enabled) {
          await NotificationService.createCycleInsight(userId, insight, {
            painDays: painLogs.length,
            period: "30 days"
          });
          console.log(`Created pain insight for user ${userId}`);
        }
      }

      // Analyze energy patterns
      const lowEnergyLogs = recentLogs.filter(log => log.energyLevel !== null && log.energyLevel <= 3);
      if (lowEnergyLogs.length >= 5) {
        const insight = `You've had low energy on ${lowEnergyLogs.length} days this month. Consider focusing on sleep, nutrition, and stress management.`;
        
        const enabled = await NotificationService.isNotificationEnabled(userId, "insight");
        if (enabled) {
          await NotificationService.createCycleInsight(userId, insight, {
            lowEnergyDays: lowEnergyLogs.length,
            period: "30 days"
          });
          console.log(`Created energy insight for user ${userId}`);
        }
      }

      // Check logging streak
      const recentDates = recentLogs.map(log => log.date);
      let streak = 0;
      const today = new Date();
      
      for (let i = 0; i < 30; i++) {
        const checkDate = new Date(today);
        checkDate.setDate(today.getDate() - i);
        const dateStr = checkDate.toISOString().split('T')[0];
        
        if (recentDates.includes(dateStr)) {
          streak++;
        } else {
          break;
        }
      }

      // Celebrate milestones
      if (streak === 7) {
        await NotificationService.createAchievement(userId, "🔥 7-day logging streak! You're building great habits!");
      } else if (streak === 14) {
        await NotificationService.createAchievement(userId, "🔥 14-day logging streak! You're on fire!");
      } else if (streak === 30) {
        await NotificationService.createAchievement(userId, "🔥 30-day logging streak! You're a logging champion!");
      }

    } catch (error) {
      console.error(`Error creating insights for user ${userId}:`, error);
    }
  }

  // Main function to run all scheduled notifications
  static async runScheduledTasks() {
    console.log("Running scheduled notification tasks...");
    
    try {
      // Process any scheduled notifications first
      await NotificationService.processScheduled();
      
      // Then check for new notifications to create
      await Promise.all([
        this.checkPeriodReminders(),
        this.checkLogReminders(),
        this.checkAndCreateInsights(),
      ]);
      
      console.log("Scheduled notification tasks completed");
    } catch (error) {
      console.error("Error running scheduled tasks:", error);
    }
  }
}
