// Simple notification manager for web notifications
export class NotificationManager {
  private static instance: NotificationManager;
  private isSupported: boolean;
  private permission: NotificationPermission;

  private constructor() {
    this.isSupported = "Notification" in window;
    this.permission = this.isSupported ? Notification.permission : "denied";
  }

  static getInstance(): NotificationManager {
    if (!NotificationManager.instance) {
      NotificationManager.instance = new NotificationManager();
    }
    return NotificationManager.instance;
  }

  async requestPermission(): Promise<boolean> {
    if (!this.isSupported) {
      return false;
    }

    if (this.permission === "granted") {
      return true;
    }

    const permission = await Notification.requestPermission();
    this.permission = permission;
    return permission === "granted";
  }

  canNotify(): boolean {
    return this.isSupported && this.permission === "granted";
  }

  notify(title: string, options?: NotificationOptions): Notification | null {
    if (!this.canNotify()) {
      return null;
    }

    const defaultOptions: NotificationOptions = {
      icon: "/favicon.ico",
      badge: "/favicon.ico",
      tag: "mecare-notification",
      ...options,
    };

    return new Notification(title, defaultOptions);
  }

  // Predefined notification types for the app
  notifyPeriodReminder(daysUntil: number): Notification | null {
    return this.notify("Period Reminder 🌸", {
      body: `Your period is expected in ${daysUntil} day${
        daysUntil === 1 ? "" : "s"
      }. Time to prepare!`,
      icon: "/favicon.ico",
      tag: "period-reminder",
    });
  }

  notifyDailyLog(): Notification | null {
    return this.notify("Daily Log Reminder 📝", {
      body: "Don't forget to log your daily health data!",
      icon: "/favicon.ico",
      tag: "daily-log-reminder",
    });
  }

  notifyWaterReminder(): Notification | null {
    return this.notify("Hydration Reminder 💧", {
      body: "Time to drink some water! Stay hydrated.",
      icon: "/favicon.ico",
      tag: "water-reminder",
    });
  }

  notifyMotivational(message: string): Notification | null {
    return this.notify("Daily Affirmation ✨", {
      body: message,
      icon: "/favicon.ico",
      tag: "motivational-message",
    });
  }

  // Schedule recurring notifications (basic implementation)
  scheduleWaterReminders(intervalHours: number): void {
    if (!this.canNotify()) return;

    const intervalMs = intervalHours * 60 * 60 * 1000;

    setInterval(() => {
      this.notifyWaterReminder();
    }, intervalMs);
  }

  scheduleDailyLogReminder(time: string): void {
    if (!this.canNotify()) return;

    const [hours, minutes] = time.split(":").map(Number);
    const now = new Date();
    const scheduledTime = new Date();
    scheduledTime.setHours(hours, minutes, 0, 0);

    // If the time has passed today, schedule for tomorrow
    if (scheduledTime <= now) {
      scheduledTime.setDate(scheduledTime.getDate() + 1);
    }

    const delay = scheduledTime.getTime() - now.getTime();

    setTimeout(() => {
      this.notifyDailyLog();

      // Schedule for next day
      setInterval(() => {
        this.notifyDailyLog();
      }, 24 * 60 * 60 * 1000);
    }, delay);
  }
}

export const notifications = NotificationManager.getInstance();
