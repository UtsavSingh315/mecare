import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";
import { db } from "@/lib/db";
import { notifications } from "@/lib/db/schema";
import { eq, and, inArray } from "drizzle-orm";

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

// POST /api/users/[userId]/notifications/bulk - Bulk actions on notifications
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const authResult = await verifyAuth(request);
    if (!authResult.success) {
      return authResult.response;
    }

    const paramsResult = await params;
    const userId = paramsResult.userId;

    if (authResult.userId !== userId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const { action, notificationIds } = body;

    if (!action || !Array.isArray(notificationIds)) {
      return NextResponse.json(
        { error: "Action and notificationIds array are required" },
        { status: 400 }
      );
    }

    let result;

    switch (action) {
      case "markAllAsRead":
        // Mark all notifications as read
        result = await db
          .update(notifications)
          .set({ 
            isRead: true,
            sentAt: new Date()
          })
          .where(eq(notifications.userId, userId))
          .returning();
        break;

      case "markAsRead":
        // Mark specific notifications as read
        if (notificationIds.length === 0) {
          return NextResponse.json(
            { error: "No notification IDs provided" },
            { status: 400 }
          );
        }
        result = await db
          .update(notifications)
          .set({ 
            isRead: true,
            sentAt: new Date()
          })
          .where(and(
            eq(notifications.userId, userId),
            inArray(notifications.id, notificationIds)
          ))
          .returning();
        break;

      case "markAsUnread":
        // Mark specific notifications as unread
        if (notificationIds.length === 0) {
          return NextResponse.json(
            { error: "No notification IDs provided" },
            { status: 400 }
          );
        }
        result = await db
          .update(notifications)
          .set({ isRead: false })
          .where(and(
            eq(notifications.userId, userId),
            inArray(notifications.id, notificationIds)
          ))
          .returning();
        break;

      case "delete":
        // Delete specific notifications
        if (notificationIds.length === 0) {
          return NextResponse.json(
            { error: "No notification IDs provided" },
            { status: 400 }
          );
        }
        result = await db
          .delete(notifications)
          .where(and(
            eq(notifications.userId, userId),
            inArray(notifications.id, notificationIds)
          ))
          .returning();
        break;

      case "deleteAll":
        // Delete all notifications
        result = await db
          .delete(notifications)
          .where(eq(notifications.userId, userId))
          .returning();
        break;

      default:
        return NextResponse.json(
          { error: "Invalid action" },
          { status: 400 }
        );
    }

    return NextResponse.json({
      success: true,
      affectedCount: result.length,
      action
    });

  } catch (error) {
    console.error("Error performing bulk action:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
