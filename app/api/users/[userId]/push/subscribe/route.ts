import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { pushSubscriptions } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await context.params;
    const subscriptionData = await request.json();

    // Validate subscription data
    if (!subscriptionData.endpoint || !subscriptionData.keys?.p256dh || !subscriptionData.keys?.auth) {
      return NextResponse.json(
        { error: "Invalid subscription data" },
        { status: 400 }
      );
    }

    // Check if subscription already exists
    const existingSubscription = await db.query.pushSubscriptions.findFirst({
      where: and(
        eq(pushSubscriptions.userId, userId),
        eq(pushSubscriptions.endpoint, subscriptionData.endpoint)
      ),
    });

    if (existingSubscription) {
      // Update existing subscription
      await db
        .update(pushSubscriptions)
        .set({
          p256dhKey: subscriptionData.keys.p256dh,
          authKey: subscriptionData.keys.auth,
          updatedAt: new Date(),
        })
        .where(eq(pushSubscriptions.id, existingSubscription.id));

      return NextResponse.json({
        message: "Push subscription updated successfully",
        subscriptionId: existingSubscription.id,
      });
    }

    // Create new subscription
    const [newSubscription] = await db
      .insert(pushSubscriptions)
      .values({
        id: crypto.randomUUID(),
        userId,
        endpoint: subscriptionData.endpoint,
        p256dhKey: subscriptionData.keys.p256dh,
        authKey: subscriptionData.keys.auth,
        userAgent: request.headers.get('user-agent') || null,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    return NextResponse.json({
      message: "Push subscription created successfully",
      subscriptionId: newSubscription.id,
    });
  } catch (error) {
    console.error("Error creating push subscription:", error);
    return NextResponse.json(
      { error: "Failed to create push subscription" },
      { status: 500 }
    );
  }
}
