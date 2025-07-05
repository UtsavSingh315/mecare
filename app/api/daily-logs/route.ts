import { NextRequest, NextResponse } from "next/server";
import { createDailyLog, getDailyLogByDate } from "@/lib/db/utils";
import { verifyToken } from "@/lib/auth";
import { ChallengeEngine } from "@/lib/challenge-engine";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const authHeader = request.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const tokenData = await verifyToken(token);
    if (!tokenData) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    const body = await request.json();
    const { userId, ...logData } = body;

    if (!userId || !logData.date) {
      return NextResponse.json(
        { error: "userId and date are required" },
        { status: 400 }
      );
    }

    // Ensure user can only create logs for themselves
    if (tokenData.id !== userId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Check if log already exists for this date
    const existingLog = await getDailyLogByDate(userId, logData.date);
    if (existingLog) {
      return NextResponse.json(
        { error: "Log already exists for this date" },
        { status: 409 }
      );
    }

    const dailyLog = await createDailyLog(userId, logData);

    // Update challenges and check for badge awards
    await ChallengeEngine.checkAndUpdateChallenges(userId, "daily_log_created");

    return NextResponse.json({
      success: true,
      data: dailyLog,
      message: "Daily log created successfully",
    });
  } catch (error) {
    console.error("Error creating daily log:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    // Verify authentication
    const authHeader = request.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const tokenData = await verifyToken(token);
    if (!tokenData) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");
    const date = searchParams.get("date");

    if (!userId || !date) {
      return NextResponse.json(
        { error: "userId and date are required" },
        { status: 400 }
      );
    }

    // Ensure user can only access their own logs
    if (tokenData.id !== userId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const dailyLog = await getDailyLogByDate(userId, date);

    return NextResponse.json({
      success: true,
      data: dailyLog,
    });
  } catch (error) {
    console.error("Error fetching daily log:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
