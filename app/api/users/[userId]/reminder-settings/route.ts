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

// GET /api/users/[userId]/reminder-settings - Get user reminder settings
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

    // Get user's reminder settings
    const userSettings = await db
      .select()
      .from(reminderSettings)
      .where(eq(reminderSettings.userId, userId));

    return NextResponse.json(userSettings);

  } catch (error) {
    console.error("Error fetching reminder settings:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST /api/users/[userId]/reminder-settings - Create reminder setting
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
    const { type, isEnabled, time, frequency, message } = body;

    if (!type) {
      return NextResponse.json(
        { error: "Type is required" },
        { status: 400 }
      );
    }

    // Check if setting already exists for this type
    const existingSetting = await db
      .select()
      .from(reminderSettings)
      .where(and(
        eq(reminderSettings.userId, userId),
        eq(reminderSettings.type, type)
      ))
      .limit(1);

    if (existingSetting.length > 0) {
      return NextResponse.json(
        { error: "Reminder setting for this type already exists" },
        { status: 409 }
      );
    }

    // Create new reminder setting
    const [newSetting] = await db
      .insert(reminderSettings)
      .values({
        userId,
        type,
        isEnabled: isEnabled ?? true,
        time,
        frequency,
        message,
      })
      .returning();

    return NextResponse.json(newSetting, { status: 201 });

  } catch (error) {
    console.error("Error creating reminder setting:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
