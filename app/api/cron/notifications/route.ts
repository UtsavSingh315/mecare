import { NextRequest, NextResponse } from "next/server";
import { NotificationScheduler } from "@/lib/notifications/scheduler";

export const dynamic = "force-dynamic";

// This endpoint should be called by a cron job (e.g., Vercel Cron, GitHub Actions, or external service)
export async function POST(request: NextRequest) {
  try {
    // Optional: Add authentication for cron job
    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;
    
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.log("Starting notification cron job...");
    
    // Run all scheduled notification tasks
    await NotificationScheduler.runScheduledTasks();
    
    return NextResponse.json({ 
      success: true, 
      message: "Notification tasks completed",
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error("Error in notification cron job:", error);
    return NextResponse.json(
      { 
        error: "Failed to run notification tasks",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}

// For manual testing
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const secret = searchParams.get("secret");
    
    // Basic protection for manual testing
    if (secret !== process.env.CRON_SECRET) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.log("Manual notification test...");
    
    await NotificationScheduler.runScheduledTasks();
    
    return NextResponse.json({ 
      success: true, 
      message: "Manual notification test completed",
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error("Error in manual notification test:", error);
    return NextResponse.json(
      { 
        error: "Failed to run notification test",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}
