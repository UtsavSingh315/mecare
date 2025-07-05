import { NextRequest, NextResponse } from "next/server";
import { createUser, generateToken } from "@/lib/auth";
import { db } from "@/lib/db";
import { userProfiles, userSettings, streaks } from "@/lib/db/schema";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      name,
      email,
      password,
      age,
      averageCycleLength,
      averagePeriodLength,
    } = body;

    if (!name || !email || !password) {
      return NextResponse.json(
        { error: "Name, email, and password are required" },
        { status: 400 }
      );
    }

    // Create user
    const user = await createUser({ name, email, password, age });

    if (!user) {
      return NextResponse.json(
        { error: "Failed to create user. Email may already exist." },
        { status: 400 }
      );
    }

    // Create user profile
    await db.insert(userProfiles).values({
      userId: user.id,
      averageCycleLength: averageCycleLength || 28,
      averagePeriodLength: averagePeriodLength || 5,
      timezone: "UTC",
    });

    // Create user settings (key-value pairs)
    const defaultSettings = [
      { key: "theme", value: "light" },
      { key: "language", value: "en" },
      { key: "dataRetentionDays", value: 365 },
    ];

    for (const setting of defaultSettings) {
      await db.insert(userSettings).values({
        userId: user.id,
        key: setting.key,
        value: setting.value,
      });
    }

    // Initialize streaks
    const streakTypes = ["logging", "water", "exercise"];
    for (const type of streakTypes) {
      await db.insert(streaks).values({
        userId: user.id,
        type: type,
        currentStreak: 0,
        longestStreak: 0,
      });
    }

    return NextResponse.json({
      success: true,
      user,
      message: "Account created successfully",
    });
  } catch (error) {
    console.error("Signup error:", error);
    
    // Provide more specific error messages
    if (error instanceof Error) {
      if (error.message.includes("unique constraint")) {
        return NextResponse.json(
          { error: "Email address is already registered" },
          { status: 409 }
        );
      }
      if (error.message.includes("DATABASE_URL")) {
        return NextResponse.json(
          { error: "Database configuration error" },
          { status: 503 }
        );
      }
    }
    
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
