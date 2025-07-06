import { db } from "@/lib/db";
import { notifications, reminderSettings, users, pushSubscriptions } from "@/lib/db/schema";
import { eq, and, lte, isNull } from "drizzle-orm";
import webpush from "web-push";

// Configure web-push with VAPID keys
if (process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT || 'mailto:support@healthtracker.com',
    process.env.VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
  );
}

export interface NotificationData {
  type: string;
  title: string;
  message?: string;
  metadata?: Record<string, any>;
  scheduledFor?: Date;
}

export class NotificationService {
  // Create a new notification
  static async create(userId: string, data: NotificationData) {
    try {
      const [notification] = await db
        .insert(notifications)
        .values({
          userId,
          type: data.type,
          title: data.title,
          message: data.message,
          metadata: data.metadata,
          scheduledFor: data.scheduledFor,
        })
        .returning();

      return notification;
    } catch (error) {
      console.error("Error creating notification:", error);
      throw error;
    }
  }

  // Send immediate notification
  static async sendImmediate(userId: string, data: NotificationData) {
    const notification = await this.create(userId, {
      ...data,
      scheduledFor: new Date(),
    });

    // Update sentAt timestamp
    await db
      .update(notifications)
      .set({ sentAt: new Date() })
      .where(eq(notifications.id, notification.id));

    return notification;
  }

  // Schedule notification for later
  static async schedule(userId: string, data: NotificationData) {
    if (!data.scheduledFor) {
      throw new Error("scheduledFor is required for scheduled notifications");
    }

    return await this.create(userId, data);
  }

  // Process scheduled notifications (to be called by cron job)
  static async processScheduled() {
    try {
      const now = new Date();
      
      // Find notifications that are scheduled for now or in the past and haven't been sent
      const scheduledNotifications = await db
        .select()
        .from(notifications)
        .where(and(
          lte(notifications.scheduledFor, now),
          isNull(notifications.sentAt)
        ));

      const results = [];

      for (const notification of scheduledNotifications) {
        try {
          // Mark as sent
          await db
            .update(notifications)
            .set({ sentAt: new Date() })
            .where(eq(notifications.id, notification.id));

          // Here you could add actual push notification sending logic
          // For now, we'll just mark them as sent
          
          results.push({
            id: notification.id,
            status: "sent",
            type: notification.type,
          });
        } catch (error) {
          console.error(`Error sending notification ${notification.id}:`, error);
          results.push({
            id: notification.id,
            status: "failed",
            error: error instanceof Error ? error.message : "Unknown error",
          });
        }
      }

      return results;
    } catch (error) {
      console.error("Error processing scheduled notifications:", error);
      throw error;
    }
  }

  // Create period reminder notification
  static async createPeriodReminder(userId: string, daysUntil: number) {
    return await this.sendImmediate(userId, {
      type: "period_reminder",
      title: `Period Expected in ${daysUntil} Day${daysUntil !== 1 ? 's' : ''}`,
      message: `Your period is expected to start in ${daysUntil} day${daysUntil !== 1 ? 's' : ''}. Consider preparing period supplies and tracking any symptoms.`,
      metadata: {
        daysUntil,
        category: "health",
        priority: "medium",
      },
    });
  }

  // Create log reminder notification
  static async createLogReminder(userId: string) {
    return await this.sendImmediate(userId, {
      type: "log_reminder",
      title: "Time to Log Your Day",
      message: "Don't forget to log your mood, energy, and any symptoms today. Consistent tracking helps with better insights!",
      metadata: {
        category: "tracking",
        priority: "low",
      },
    });
  }

  // Create cycle insights notification
  static async createCycleInsight(userId: string, insight: string, data?: Record<string, any>) {
    return await this.sendImmediate(userId, {
      type: "cycle_insight",
      title: "New Cycle Insight",
      message: insight,
      metadata: {
        category: "insights",
        priority: "medium",
        data,
      },
    });
  }

  // Create achievement notification
  static async createAchievement(userId: string, achievement: string) {
    return await this.sendImmediate(userId, {
      type: "achievement",
      title: "Achievement Unlocked! 🏆",
      message: achievement,
      metadata: {
        category: "gamification",
        priority: "high",
      },
    });
  }

  // Create medication reminder
  static async createMedicationReminder(userId: string, medicationName: string) {
    return await this.sendImmediate(userId, {
      type: "medication_reminder",
      title: "Medication Reminder",
      message: `Time to take your ${medicationName}. Don't forget to log any side effects or symptoms.`,
      metadata: {
        medicationName,
        category: "health",
        priority: "high",
      },
    });
  }

  // Create symptom alert
  static async createSymptomAlert(userId: string, symptom: string, severity: string) {
    return await this.sendImmediate(userId, {
      type: "symptom_alert",
      title: "Symptom Pattern Detected",
      message: `We've noticed a pattern with ${symptom} (${severity} severity). Consider consulting with your healthcare provider.`,
      metadata: {
        symptom,
        severity,
        category: "health",
        priority: "high",
      },
    });
  }

  // Get user's notification preferences
  static async getUserPreferences(userId: string) {
    try {
      const preferences = await db
        .select()
        .from(reminderSettings)
        .where(eq(reminderSettings.userId, userId));

      return preferences;
    } catch (error) {
      console.error("Error getting user notification preferences:", error);
      return [];
    }
  }

  // Check if user has notifications enabled for a type
  static async isNotificationEnabled(userId: string, type: string): Promise<boolean> {
    try {
      const preference = await db
        .select()
        .from(reminderSettings)
        .where(and(
          eq(reminderSettings.userId, userId),
          eq(reminderSettings.type, type)
        ))
        .limit(1);

      return preference.length > 0 ? (preference[0].isEnabled ?? true) : true; // Default to enabled
    } catch (error) {
      console.error("Error checking notification preference:", error);
      return true; // Default to enabled on error
    }
  }

  // Send push notifications to user's devices
  static async sendPushNotification(userId: string, data: NotificationData) {
    try {
      // Get all active push subscriptions for this user
      const subscriptions = await db.query.pushSubscriptions.findMany({
        where: and(
          eq(pushSubscriptions.userId, userId),
          eq(pushSubscriptions.isActive, true)
        ),
      });

      if (subscriptions.length === 0) {
        console.log(`No active push subscriptions found for user ${userId}`);
        return { sent: 0, failed: 0 };
      }

      const payload = {
        title: data.title,
        body: data.message || data.title,
        icon: this.getNotificationIcon(data.type),
        badge: this.getNotificationBadge(data.type),
        data: {
          type: data.type,
          url: this.getNotificationUrl(data.type),
          notificationId: data.metadata?.notificationId,
          ...data.metadata,
        },
        actions: this.getNotificationActions(data.type),
        requireInteraction: this.shouldRequireInteraction(data.type),
        silent: false,
      };

      const results = await Promise.allSettled(
        subscriptions.map(async (subscription) => {
          const pushSubscription = {
            endpoint: subscription.endpoint,
            keys: {
              p256dh: subscription.p256dhKey,
              auth: subscription.authKey,
            },
          };

          try {
            await webpush.sendNotification(
              pushSubscription,
              JSON.stringify(payload),
              {
                TTL: 86400, // 24 hours
                urgency: this.getNotificationUrgency(data.type) as 'very-low' | 'low' | 'normal' | 'high',
              }
            );
            return { success: true, subscriptionId: subscription.id };
          } catch (error: any) {
            console.error('Failed to send push notification:', error);
            
            // If subscription is invalid, deactivate it
            if (error.statusCode === 410 || error.statusCode === 404) {
              await db
                .update(pushSubscriptions)
                .set({ isActive: false, updatedAt: new Date() })
                .where(eq(pushSubscriptions.id, subscription.id));
            }
            
            throw error;
          }
        })
      );

      const successful = results.filter(
        (result) => result.status === 'fulfilled'
      ).length;
      const failed = results.length - successful;

      return { sent: successful, failed };
    } catch (error) {
      console.error("Error sending push notifications:", error);
      return { sent: 0, failed: 1 };
    }
  }

  // Enhanced send immediate with push support
  static async sendImmediateWithPush(userId: string, data: NotificationData) {
    // Create in-app notification
    const notification = await this.sendImmediate(userId, data);

    // Send push notification
    const pushResult = await this.sendPushNotification(userId, {
      ...data,
      metadata: { ...data.metadata, notificationId: notification.id }
    });

    console.log(`Push notification result for user ${userId}: sent=${pushResult.sent}, failed=${pushResult.failed}`);

    return notification;
  }

  // Get notification icon based on type
  private static getNotificationIcon(type: string): string {
    switch (type) {
      case "period_reminder":
        return "/period-icon.png";
      case "medication_reminder":
        return "/medication-icon.png";
      case "log_reminder":
        return "/log-icon.png";
      case "achievement":
        return "/achievement-icon.png";
      case "cycle_insight":
        return "/insight-icon.png";
      case "symptom_alert":
        return "/alert-icon.png";
      default:
        return "/icon-192x192.png";
    }
  }

  // Get notification badge based on type
  private static getNotificationBadge(type: string): string {
    switch (type) {
      case "period_reminder":
        return "/period-badge.png";
      case "medication_reminder":
        return "/medication-badge.png";
      default:
        return "/icon-72x72.png";
    }
  }

  // Get notification URL based on type
  private static getNotificationUrl(type: string): string {
    switch (type) {
      case "log_reminder":
        return "/log";
      case "cycle_insight":
        return "/insights";
      case "achievement":
        return "/";
      default:
        return "/notifications";
    }
  }

  // Get notification actions based on type
  private static getNotificationActions(type: string): any[] {
    switch (type) {
      case "log_reminder":
        return [
          { action: "log-now", title: "Log Now", icon: "/log-icon.png" },
          { action: "remind-later", title: "Remind Later" }
        ];
      case "cycle_insight":
        return [
          { action: "view-insights", title: "View Insights", icon: "/insight-icon.png" },
          { action: "dismiss", title: "Dismiss" }
        ];
      default:
        return [
          { action: "view", title: "View", icon: "/icon-72x72.png" },
          { action: "dismiss", title: "Dismiss" }
        ];
    }
  }

  // Check if notification should require interaction
  private static shouldRequireInteraction(type: string): boolean {
    return ["period_reminder", "medication_reminder", "symptom_alert"].includes(type);
  }

  // Get notification urgency
  private static getNotificationUrgency(type: string): 'very-low' | 'low' | 'normal' | 'high' {
    switch (type) {
      case "period_reminder":
      case "medication_reminder":
      case "symptom_alert":
        return "high";
      case "log_reminder":
        return "normal";
      default:
        return "low";
    }
  }
}
