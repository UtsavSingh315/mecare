import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { pushSubscriptions } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await context.params;

    // Deactivate all push subscriptions for this user
    await db
      .update(pushSubscriptions)
      .set({
        isActive: false,
        updatedAt: new Date(),
      })
      .where(eq(pushSubscriptions.userId, userId));

    return NextResponse.json({
      message: "Push subscriptions deactivated successfully",
    });
  } catch (error) {
    console.error("Error deactivating push subscriptions:", error);
    return NextResponse.json(
      { error: "Failed to deactivate push subscriptions" },
      { status: 500 }
    );
  }
}
