import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";
import { db } from "@/lib/db";
import { reminderSettings } from "@/lib/db/schema";
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

// PUT /api/users/[userId]/reminder-settings/[settingId] - Update reminder setting
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string; settingId: string }> }
) {
  try {
    const authResult = await verifyAuth(request);
    if (!authResult.success) {
      return authResult.response;
    }

    const paramsResult = await params;
    const { userId, settingId } = paramsResult;

    if (authResult.userId !== userId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const { type, isEnabled, time, frequency, message } = body;

    // Check if setting exists and belongs to the user
    const existingSetting = await db
      .select()
      .from(reminderSettings)
      .where(and(
        eq(reminderSettings.id, settingId),
        eq(reminderSettings.userId, userId)
      ))
      .limit(1);

    if (existingSetting.length === 0) {
      return NextResponse.json(
        { error: "Reminder setting not found" },
        { status: 404 }
      );
    }

    // Update reminder setting
    const [updatedSetting] = await db
      .update(reminderSettings)
      .set({
        ...(type !== undefined && { type }),
        ...(isEnabled !== undefined && { isEnabled }),
        ...(time !== undefined && { time }),
        ...(frequency !== undefined && { frequency }),
        ...(message !== undefined && { message }),
        updatedAt: new Date(),
      })
      .where(eq(reminderSettings.id, settingId))
      .returning();

    return NextResponse.json(updatedSetting);

  } catch (error) {
    console.error("Error updating reminder setting:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE /api/users/[userId]/reminder-settings/[settingId] - Delete reminder setting
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string; settingId: string }> }
) {
  try {
    const authResult = await verifyAuth(request);
    if (!authResult.success) {
      return authResult.response;
    }

    const paramsResult = await params;
    const { userId, settingId } = paramsResult;

    if (authResult.userId !== userId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Check if setting exists and belongs to the user
    const existingSetting = await db
      .select()
      .from(reminderSettings)
      .where(and(
        eq(reminderSettings.id, settingId),
        eq(reminderSettings.userId, userId)
      ))
      .limit(1);

    if (existingSetting.length === 0) {
      return NextResponse.json(
        { error: "Reminder setting not found" },
        { status: 404 }
      );
    }

    // Delete reminder setting
    await db
      .delete(reminderSettings)
      .where(eq(reminderSettings.id, settingId));

    return NextResponse.json({ message: "Reminder setting deleted successfully" });

  } catch (error) {
    console.error("Error deleting reminder setting:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
