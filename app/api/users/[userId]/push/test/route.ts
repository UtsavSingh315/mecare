import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { pushSubscriptions } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import webpush from "web-push";

// Configure web-push with VAPID keys
if (process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT || 'mailto:support@healthtracker.com',
    process.env.VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
  );
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await context.params;

    // Check if VAPID keys are configured
    if (!process.env.VAPID_PUBLIC_KEY || !process.env.VAPID_PRIVATE_KEY) {
      return NextResponse.json(
        { error: "Push notifications not configured on server" },
        { status: 500 }
      );
    }

    // Get all active push subscriptions for this user
    const subscriptions = await db.query.pushSubscriptions.findMany({
      where: and(
        eq(pushSubscriptions.userId, userId),
        eq(pushSubscriptions.isActive, true)
      ),
    });

    if (subscriptions.length === 0) {
      return NextResponse.json(
        { error: "No active push subscriptions found" },
        { status: 404 }
      );
    }

    const payload = {
      title: "🧪 Test Notification",
      body: "This is a test push notification from your Health Tracker app!",
      icon: "/icon-192x192.png",
      badge: "/icon-72x72.png",
      data: {
        type: "test",
        url: "/notifications",
        timestamp: new Date().toISOString(),
      },
      actions: [
        {
          action: "view",
          title: "View App",
          icon: "/icon-72x72.png"
        }
      ],
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
              urgency: 'normal',
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
          
          return { 
            success: false, 
            subscriptionId: subscription.id, 
            error: error.message 
          };
        }
      })
    );

    const successful = results.filter(
      (result) => result.status === 'fulfilled' && result.value.success
    ).length;

    const failed = results.length - successful;

    return NextResponse.json({
      message: `Test notification sent to ${successful} device(s)`,
      successful,
      failed,
      details: results.map((result) => 
        result.status === 'fulfilled' ? result.value : { success: false, error: 'Unknown error' }
      ),
    });
  } catch (error) {
    console.error("Error sending test push notification:", error);
    return NextResponse.json(
      { error: "Failed to send test notification" },
      { status: 500 }
    );
  }
}
