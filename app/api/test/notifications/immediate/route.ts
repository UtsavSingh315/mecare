import { NextRequest, NextResponse } from "next/server";
import { NotificationService } from "@/lib/notifications/service";
import { verifyToken } from "@/lib/auth";

export const dynamic = "force-dynamic";

// Test endpoint to immediately create notifications for the current user
export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const authHeader = request.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Missing or invalid authorization header" }, { status: 401 });
    }

    const token = authHeader.split(" ")[1];
    const user = await verifyToken(token);
    
    if (!user) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    const userId = user.id;
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type") || "log";

    console.log(`Creating immediate test ${type} notification for user ${userId}`);

    let notification: any;

    switch (type) {
      case "log":
        notification = await NotificationService.createLogReminder(userId);
        break;
      case "period":
        notification = await NotificationService.createPeriodReminder(userId, 3);
        break;
      case "achievement":
        notification = await NotificationService.createAchievement(userId, "🎉 Test achievement! You're awesome!");
        break;
      default:
        return NextResponse.json({ error: "Invalid notification type" }, { status: 400 });
    }

    // Also send as push notification if enabled
    try {
      await NotificationService.sendPushNotification(userId, {
        title: `Test ${type} notification`,
        message: `This is a test ${type} notification sent immediately`,
        type,
        metadata: { notificationId: notification.id, test: true }
      });
    } catch (pushError) {
      console.warn("Push notification failed:", pushError);
    }

    return NextResponse.json({ 
      success: true, 
      message: `Test ${type} notification created`,
      notificationId: notification.id,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error("Error creating immediate test notification:", error);
    return NextResponse.json(
      { 
        error: "Failed to create test notification",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}
