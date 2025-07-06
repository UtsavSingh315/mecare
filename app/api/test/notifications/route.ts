import { NextRequest, NextResponse } from "next/server";
import { NotificationScheduler } from "@/lib/notifications/scheduler";
import { NotificationService } from "@/lib/notifications/service";

export const dynamic = "force-dynamic";

// Test endpoint for manual notification testing
export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get("action");
    const userId = searchParams.get("userId");

    switch (action) {
      case "log-reminder":
        if (!userId) {
          return NextResponse.json({ error: "userId required for log-reminder test" }, { status: 400 });
        }
        await NotificationScheduler.createLogReminderForUser(userId);
        return NextResponse.json({ 
          success: true, 
          message: `Log reminder processed for user ${userId}`,
          timestamp: new Date().toISOString()
        });

      case "check-log-reminders":
        await NotificationScheduler.checkLogReminders();
        return NextResponse.json({ 
          success: true, 
          message: "Log reminders check completed",
          timestamp: new Date().toISOString()
        });

      case "process-scheduled":
        await NotificationService.processScheduled();
        return NextResponse.json({ 
          success: true, 
          message: "Scheduled notifications processed",
          timestamp: new Date().toISOString()
        });

      case "full-run":
        await NotificationScheduler.runScheduledTasks();
        return NextResponse.json({ 
          success: true, 
          message: "Full notification tasks completed",
          timestamp: new Date().toISOString()
        });

      default:
        return NextResponse.json({ 
          error: "Invalid action. Use: log-reminder, check-log-reminders, process-scheduled, or full-run",
          availableActions: ["log-reminder", "check-log-reminders", "process-scheduled", "full-run"]
        }, { status: 400 });
    }

  } catch (error) {
    console.error("Error in notification test:", error);
    return NextResponse.json(
      { 
        error: "Failed to run notification test",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}

// GET endpoint for quick status check
export async function GET(request: NextRequest) {
  const now = new Date();
  return NextResponse.json({
    message: "Notification test endpoint is ready",
    currentTime: now.toISOString(),
    currentHour: now.getHours(),
    currentMinute: now.getMinutes(),
    availableActions: ["log-reminder", "check-log-reminders", "process-scheduled", "full-run"],
    usage: {
      logReminder: "POST /api/test/notifications?action=log-reminder&userId=USER_ID",
      checkLogReminders: "POST /api/test/notifications?action=check-log-reminders",
      processScheduled: "POST /api/test/notifications?action=process-scheduled",
      fullRun: "POST /api/test/notifications?action=full-run"
    }
  });
}
