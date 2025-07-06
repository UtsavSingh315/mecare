// Performance optimization utilities for parallel database queries
import { db } from "./index";
import { 
  users, 
  userProfiles, 
  dailyLogs, 
  cycles, 
  periodDays, 
  streaks, 
  userBadges, 
  badges as badgesTable 
} from "./schema";
import { eq, and, gte, lte, desc, count } from "drizzle-orm";

// ==================== OPTIMIZED DASHBOARD DATA ====================

export async function getDashboardDataOptimized(userId: string) {
  // Timeout wrapper for database queries
  const withTimeout = <T>(promise: Promise<T>, ms: number = 5000): Promise<T> => {
    return Promise.race([
      promise,
      new Promise<T>((_, reject) => 
        setTimeout(() => reject(new Error(`Query timeout after ${ms}ms`)), ms)
      )
    ]);
  };

  try {
    // Run all queries in parallel with timeout protection
    const [
      profile,
      streaksData,
      badgesData,
      totalLoggedResult,
      activeCycleResult
    ] = await Promise.all([
      // Query 1: User profile with timeout
      withTimeout(
        db.select().from(users).where(eq(users.id, userId)).limit(1)
      ),
      
      // Query 2: User streaks with timeout
      withTimeout(
        db.select().from(streaks).where(eq(streaks.userId, userId))
      ),
      
      // Query 3: User badges with join and timeout
      withTimeout(
        db.select({
          badge: badgesTable,
          earnedAt: userBadges.earnedAt
        })
        .from(userBadges)
        .leftJoin(badgesTable, eq(userBadges.badgeId, badgesTable.id))
        .where(eq(userBadges.userId, userId))
        .orderBy(desc(userBadges.earnedAt))
      ),
      
      // Query 4: Total logged count with timeout
      withTimeout(
        db.select({ count: count() })
          .from(dailyLogs)
          .where(eq(dailyLogs.userId, userId))
      ),
      
      // Query 5: Active cycle for current day calculation with timeout
      withTimeout(
        db.select()
          .from(cycles)
          .where(and(
            eq(cycles.userId, userId),
            eq(cycles.isActive, true)
          ))
          .limit(1)
      )
    ]);

    // Process results
    const currentStreak = streaksData.find(s => s.type === "logging")?.currentStreak || 0;
    const totalLogged = totalLoggedResult[0]?.count || 0;
    const badgeNames = badgesData.map((b: any) => b.badge?.name || "Unknown Badge");
    
    // Calculate current cycle day
    let currentCycleDay = 1;
    if (activeCycleResult[0]?.startDate) {
      const cycleStart = new Date(activeCycleResult[0].startDate + "T00:00:00");
      const today = new Date();
      const daysDiff = Math.floor((today.getTime() - cycleStart.getTime()) / (1000 * 60 * 60 * 24));
      currentCycleDay = daysDiff + 1;
    }

    return {
      currentStreak,
      totalLogged,
      badges: badgeNames,
      currentCycle: currentCycleDay,
      averageCycle: 28,
      nextPeriod: null,
      fertilityWindow: { start: null, end: null }
    };
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    
    // Return fallback data instead of throwing
    return {
      currentStreak: 0,
      totalLogged: 0,
      badges: [],
      currentCycle: 1,
      averageCycle: 28,
      nextPeriod: null,
      fertilityWindow: { start: null, end: null }
    };
  }
}

// ==================== OPTIMIZED CALENDAR DATA ====================

export async function getCalendarDataOptimized(
  userId: string, 
  year: number, 
  month: number
) {
  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0);
  const startDateStr = startDate.toISOString().split("T")[0];
  const endDateStr = endDate.toISOString().split("T")[0];

  // Timeout wrapper for database queries
  const withTimeout = <T>(promise: Promise<T>, ms: number = 5000): Promise<T> => {
    return Promise.race([
      promise,
      new Promise<T>((_, reject) => 
        setTimeout(() => reject(new Error(`Query timeout after ${ms}ms`)), ms)
      )
    ]);
  };

  try {
    // Run all calendar queries in parallel with timeout
    const [
      userProfileResult,
      logsResult,
      periodsResult,
      recentCyclesResult
    ] = await Promise.all([
      // Query 1: User profile with timeout
      withTimeout(
        db.select()
          .from(userProfiles)
          .where(eq(userProfiles.userId, userId))
          .limit(1)
      ),
      
      // Query 2: Daily logs for month with timeout
      withTimeout(
        db.select()
          .from(dailyLogs)
          .where(and(
            eq(dailyLogs.userId, userId),
            gte(dailyLogs.date, startDateStr),
            lte(dailyLogs.date, endDateStr)
          ))
          .orderBy(dailyLogs.date)
      ),
      
      // Query 3: Period days for month with timeout
      withTimeout(
        db.select()
          .from(periodDays)
          .where(and(
            eq(periodDays.userId, userId),
            gte(periodDays.date, startDateStr),
            lte(periodDays.date, endDateStr)
          ))
          .orderBy(periodDays.date)
      ),
      
      // Query 4: Recent cycles with timeout
      withTimeout(
        db.select()
          .from(cycles)
          .where(eq(cycles.userId, userId))
          .orderBy(desc(cycles.startDate))
          .limit(3)
      )
    ]);

    return {
      userProfile: userProfileResult[0] || null,
      logs: logsResult,
      periods: periodsResult,
      recentCycles: recentCyclesResult
    };
  } catch (error) {
    console.error('Error fetching calendar data:', error);
    
    // Return fallback data instead of throwing
    return {
      userProfile: null,
      logs: [],
      periods: [],
      recentCycles: []
    };
  }
}

// ==================== CACHED AUTH VERIFICATION ====================

const authCache = new Map<string, { user: any; timestamp: number }>();
const AUTH_CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export async function getCachedUser(token: string): Promise<any | null> {
  const cached = authCache.get(token);
  
  if (cached && Date.now() - cached.timestamp < AUTH_CACHE_DURATION) {
    return cached.user;
  }
  
  // If not cached or expired, verify token and cache result
  try {
    const { verifyToken } = await import("../auth");
    const user = await verifyToken(token);
    
    if (user) {
      authCache.set(token, { user, timestamp: Date.now() });
      
      // Clean up old cache entries
      if (authCache.size > 100) {
        const oldEntries = Array.from(authCache.entries())
          .filter(([_, data]) => Date.now() - data.timestamp > AUTH_CACHE_DURATION);
        oldEntries.forEach(([key]) => authCache.delete(key));
      }
    }
    
    return user;
  } catch (error) {
    return null;
  }
}

// ==================== DATABASE CONNECTION OPTIMIZATION ====================

export function optimizeDbConnection() {
  // Increase connection pool for better performance
  // This would go in db/index.ts configuration
  return {
    max: 30, // Increase from 20
    idle_timeout: 30, // Increase from 20
    connect_timeout: 5, // Decrease from 10
    transform: {
      undefined: null // Handle undefined values better
    }
  };
}
