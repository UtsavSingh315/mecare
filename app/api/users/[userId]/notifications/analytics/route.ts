import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { notifications, pushSubscriptions } from "@/lib/db/schema";
import { eq, and, gte, sql, desc } from "drizzle-orm";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await context.params;
    const { searchParams } = new URL(request.url);
    const range = searchParams.get("range") || "7d";

    // Calculate date range
    const now = new Date();
    const daysAgo = range === "7d" ? 7 : range === "30d" ? 30 : 90;
    const startDate = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);

    // Get notifications within date range
    const notificationsData = await db.query.notifications.findMany({
      where: and(
        eq(notifications.userId, userId),
        gte(notifications.createdAt, startDate)
      ),
      orderBy: [desc(notifications.createdAt)],
    });

    // Calculate totals
    const totalSent = notificationsData.length;
    const totalRead = notificationsData.filter(n => n.isRead).length;
    const totalClicked = notificationsData.filter(n => 
      n.metadata && (n.metadata as any).clicked
    ).length;

    const readRate = totalSent > 0 ? (totalRead / totalSent) * 100 : 0;
    const clickRate = totalSent > 0 ? (totalClicked / totalSent) * 100 : 0;

    // Group by type
    const byTypeMap = new Map();
    notificationsData.forEach(notification => {
      const type = notification.type;
      if (!byTypeMap.has(type)) {
        byTypeMap.set(type, { type, sent: 0, read: 0, clicked: 0 });
      }
      const typeData = byTypeMap.get(type);
      typeData.sent++;
      if (notification.isRead) typeData.read++;
      if (notification.metadata && (notification.metadata as any).clicked) {
        typeData.clicked++;
      }
    });

    const byType = Array.from(byTypeMap.values()).map(typeData => ({
      ...typeData,
      readRate: typeData.sent > 0 ? (typeData.read / typeData.sent) * 100 : 0,
      clickRate: typeData.sent > 0 ? (typeData.clicked / typeData.sent) * 100 : 0,
    }));

    // Group by day
    const byDayMap = new Map();
    for (let i = 0; i < daysAgo; i++) {
      const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const dateKey = date.toISOString().split('T')[0];
      byDayMap.set(dateKey, { date: dateKey, sent: 0, read: 0, clicked: 0 });
    }

    notificationsData.forEach(notification => {
      const dateKey = notification.createdAt.toISOString().split('T')[0];
      if (byDayMap.has(dateKey)) {
        const dayData = byDayMap.get(dateKey);
        dayData.sent++;
        if (notification.isRead) dayData.read++;
        if (notification.metadata && (notification.metadata as any).clicked) {
          dayData.clicked++;
        }
      }
    });

    const byDay = Array.from(byDayMap.values()).reverse();

    // Get device breakdown
    const pushSubs = await db.query.pushSubscriptions.findMany({
      where: eq(pushSubscriptions.userId, userId),
    });

    const deviceBreakdownMap = new Map();
    pushSubs.forEach(sub => {
      // Parse user agent to determine device type
      const userAgent = sub.userAgent || 'Unknown';
      let deviceType = 'Desktop';
      
      if (userAgent.includes('Mobile') || userAgent.includes('Android')) {
        deviceType = 'Mobile';
      } else if (userAgent.includes('Tablet') || userAgent.includes('iPad')) {
        deviceType = 'Tablet';
      }

      if (!deviceBreakdownMap.has(deviceType)) {
        deviceBreakdownMap.set(deviceType, { deviceType, count: 0, active: 0 });
      }
      const deviceData = deviceBreakdownMap.get(deviceType);
      deviceData.count++;
      if (sub.isActive) deviceData.active++;
    });

    const deviceBreakdown = Array.from(deviceBreakdownMap.values());

    const analytics = {
      totalSent,
      totalRead,
      totalClicked,
      readRate,
      clickRate,
      byType,
      byDay,
      deviceBreakdown,
    };

    return NextResponse.json(analytics);
  } catch (error) {
    console.error("Error fetching notification analytics:", error);
    return NextResponse.json(
      { error: "Failed to fetch notification analytics" },
      { status: 500 }
    );
  }
}
