import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";
import { db } from "@/lib/db";
import { notifications } from "@/lib/db/schema";
import { eq, and, desc, asc } from "drizzle-orm";

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

// GET /api/users/[userId]/notifications - Get user notifications
export async function GET(
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

    const { searchParams } = new URL(request.url);
    const unreadOnly = searchParams.get("unread") === "true";
    const limit = parseInt(searchParams.get("limit") || "50");
    const offset = parseInt(searchParams.get("offset") || "0");

    // Build query conditions
    const conditions = [eq(notifications.userId, userId)];
    if (unreadOnly) {
      conditions.push(eq(notifications.isRead, false));
    }

    // Get notifications
    const userNotifications = await db
      .select()
      .from(notifications)
      .where(and(...conditions))
      .orderBy(desc(notifications.createdAt))
      .limit(limit)
      .offset(offset);

    // Get unread count
    const unreadCount = await db
      .select({ count: notifications.id })
      .from(notifications)
      .where(and(eq(notifications.userId, userId), eq(notifications.isRead, false)));

    return NextResponse.json({
      notifications: userNotifications,
      unreadCount: unreadCount.length,
      hasMore: userNotifications.length === limit
    });

  } catch (error) {
    console.error("Error fetching notifications:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST /api/users/[userId]/notifications - Create notification
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
    const { type, title, message, scheduledFor, metadata } = body;

    if (!type || !title) {
      return NextResponse.json(
        { error: "Type and title are required" },
        { status: 400 }
      );
    }

    // Create notification
    const [newNotification] = await db
      .insert(notifications)
      .values({
        userId,
        type,
        title,
        message,
        scheduledFor: scheduledFor ? new Date(scheduledFor) : null,
        metadata: metadata || null,
      })
      .returning();

    return NextResponse.json(newNotification, { status: 201 });

  } catch (error) {
    console.error("Error creating notification:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
