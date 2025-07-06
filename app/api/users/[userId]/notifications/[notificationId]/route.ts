import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";
import { db } from "@/lib/db";
import { notifications } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";

export const dynamic = "force-dynamic";

async function verifyAuth(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return {
      success: false,
      response: NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    };
  }

  const token = authHeader.substring(7);
  const tokenData = await verifyToken(token);
  if (!tokenData) {
    return {
      success: false,
      response: NextResponse.json({ error: "Invalid token" }, { status: 401 })
    };
  }

  return { success: true, userId: tokenData.id };
}

// PATCH /api/users/[userId]/notifications/[notificationId] - Mark as read/unread
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string; notificationId: string }> }
) {
  try {
    const authResult = await verifyAuth(request);
    if (!authResult.success) {
      return authResult.response;
    }

    const paramsResult = await params;
    const { userId, notificationId } = paramsResult;

    if (authResult.userId !== userId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const { isRead } = body;

    if (typeof isRead !== "boolean") {
      return NextResponse.json(
        { error: "isRead must be a boolean" },
        { status: 400 }
      );
    }

    // Update notification
    const [updatedNotification] = await db
      .update(notifications)
      .set({ 
        isRead,
        ...(isRead && { sentAt: new Date() })
      })
      .where(and(
        eq(notifications.id, notificationId),
        eq(notifications.userId, userId)
      ))
      .returning();

    if (!updatedNotification) {
      return NextResponse.json(
        { error: "Notification not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(updatedNotification);

  } catch (error) {
    console.error("Error updating notification:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE /api/users/[userId]/notifications/[notificationId] - Delete notification
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string; notificationId: string }> }
) {
  try {
    const authResult = await verifyAuth(request);
    if (!authResult.success) {
      return authResult.response;
    }

    const paramsResult = await params;
    const { userId, notificationId } = paramsResult;

    if (authResult.userId !== userId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Delete notification
    const [deletedNotification] = await db
      .delete(notifications)
      .where(and(
        eq(notifications.id, notificationId),
        eq(notifications.userId, userId)
      ))
      .returning();

    if (!deletedNotification) {
      return NextResponse.json(
        { error: "Notification not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error("Error deleting notification:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
