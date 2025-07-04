// Load environment variables first
import dotenv from "dotenv";
import { resolve } from "path";

// Load .env.local file
dotenv.config({ path: resolve(process.cwd(), ".env.local") });

import { db } from "./index";
import {
  users,
  dailyLogs,
  cycles,
  periodDays,
  userBadges,
  badges,
  symptoms,
  dailyLogSymptoms,
  streaks,
} from "./schema";
import { eq } from "drizzle-orm";

// Sample moods and symptoms for variety
const moods = [
  "happy",
  "sad",
  "anxious",
  "calm",
  "energetic",
  "tired",
  "confident",
  "stressed",
];
const symptomNames = [
  "Cramps",
  "Headache",
  "Bloating",
  "Mood Swings",
  "Fatigue",
  "Nausea",
  "Back Pain",
  "Tender Breasts",
];
const flowIntensities = ["light", "medium", "heavy"];

// Helper function to get random item from array
function getRandomItem<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

// Helper function to get random number in range
function getRandomNumber(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Helper function to get date string
function getDateString(date: Date): string {
  return date.toISOString().split("T")[0];
}

export async function seedUserData() {
  try {
    console.log("🌱 Starting to seed user data...");

    // Get all test users
    const testUsers = await db.select().from(users);
    console.log(`Found ${testUsers.length} users to seed data for`);

    // Get or create symptom records
    let symptomRecords = await db.select().from(symptoms);
    if (symptomRecords.length === 0) {
      console.log("Creating symptom records...");
      for (const symptomName of symptomNames) {
        await db.insert(symptoms).values({
          name: symptomName,
          category: "physical",
          isDefault: true,
        });
      }
      symptomRecords = await db.select().from(symptoms);
    }

    // Get or create badge records
    let badgeRecords = await db.select().from(badges);
    if (badgeRecords.length === 0) {
      console.log("Creating badge records...");
      const badgesToCreate = [
        {
          name: "First Log",
          description: "Log your first day",
          requirement: "log_count:1",
          badgeIcon: "🎯",
          isActive: true,
        },
        {
          name: "Week Warrior",
          description: "Log for 7 consecutive days",
          requirement: "streak:7",
          badgeIcon: "⭐",
          isActive: true,
        },
        {
          name: "Month Master",
          description: "Log for 30 days",
          requirement: "log_count:30",
          badgeIcon: "🏆",
          isActive: true,
        },
        {
          name: "Cycle Tracker",
          description: "Complete a full cycle",
          requirement: "cycle_count:1",
          badgeIcon: "🔄",
          isActive: true,
        },
        {
          name: "Pain Warrior",
          description: "Track pain levels consistently",
          requirement: "pain_logs:10",
          badgeIcon: "💪",
          isActive: true,
        },
      ];

      for (const badge of badgesToCreate) {
        await db.insert(badges).values(badge);
      }
      badgeRecords = await db.select().from(badges);
    }

    for (const user of testUsers) {
      console.log(`\n📊 Seeding data for ${user.name} (${user.email})...`);

      // Create cycle data (last 3 months)
      const cycleRecords: any[] = [];
      const now = new Date();

      for (let i = 2; i >= 0; i--) {
        const cycleStart = new Date(
          now.getFullYear(),
          now.getMonth() - i,
          getRandomNumber(1, 5)
        );
        const cycleLength = getRandomNumber(26, 32);
        const periodLength = getRandomNumber(4, 7);
        const cycleEnd = new Date(cycleStart);
        cycleEnd.setDate(cycleStart.getDate() + cycleLength);

        const cycle = await db
          .insert(cycles)
          .values({
            userId: user.id,
            startDate: getDateString(cycleStart),
            endDate: getDateString(cycleEnd),
            cycleLength: cycleLength,
            periodLength: periodLength,
            isActive: i === 0, // Only the most recent cycle is active
            notes: i === 0 ? "Current cycle" : `Cycle ${3 - i}`,
          })
          .returning();

        cycleRecords.push({
          ...cycle[0],
          startDateObj: cycleStart,
          periodLength,
        });

        // Create period days for this cycle
        for (let j = 0; j < periodLength; j++) {
          const periodDate = new Date(cycleStart);
          periodDate.setDate(cycleStart.getDate() + j);

          await db.insert(periodDays).values({
            userId: user.id,
            cycleId: cycle[0].id,
            date: getDateString(periodDate),
            flowIntensity: getRandomItem(flowIntensities),
            notes:
              j === 0
                ? "Period started"
                : j === periodLength - 1
                ? "Period ended"
                : null,
          });
        }
      }

      // Create daily logs for the last 60 days
      const dailyLogsData = [];
      let streakCount = 0;
      let totalLogs = 0;

      for (let i = 59; i >= 0; i--) {
        const logDate = new Date();
        logDate.setDate(logDate.getDate() - i);
        const dateStr = getDateString(logDate);

        // Randomly skip some days to make it realistic (80% chance of logging)
        if (Math.random() < 0.8) {
          // Check if this date is during a period
          const isOnPeriod = cycleRecords.some((cycle: any) => {
            const periodStart = cycle.startDateObj;
            const periodEnd = new Date(periodStart);
            periodEnd.setDate(periodStart.getDate() + cycle.periodLength - 1);
            return logDate >= periodStart && logDate <= periodEnd;
          });

          const logData = {
            userId: user.id,
            date: dateStr,
            mood: getRandomItem(moods),
            painLevel: isOnPeriod
              ? getRandomNumber(3, 8)
              : getRandomNumber(0, 4),
            energyLevel: isOnPeriod
              ? getRandomNumber(2, 6)
              : getRandomNumber(4, 9),
            waterIntake: getRandomNumber(4, 12),
            sleepHours: (getRandomNumber(60, 90) / 10).toString(), // Convert to decimal string
            exerciseMinutes: Math.random() < 0.7 ? getRandomNumber(15, 90) : 0,
            weight: ((user.age || 25) > 25
              ? getRandomNumber(500, 800) / 10
              : getRandomNumber(450, 750) / 10
            ).toString(), // Convert to decimal string
            notes: Math.random() < 0.3 ? `Day ${60 - i} notes` : null,
            isOnPeriod: isOnPeriod,
          };

          const dailyLog = await db
            .insert(dailyLogs)
            .values(logData)
            .returning();
          dailyLogsData.push(dailyLog[0]);
          totalLogs++;

          // Current streak calculation (consecutive days from today backward)
          if (i <= 7) {
            // Only count recent days for current streak
            streakCount++;
          }

          // Add some symptoms if on period or randomly
          if (isOnPeriod || Math.random() < 0.2) {
            const numSymptoms = getRandomNumber(1, 3);
            const selectedSymptoms = symptomRecords
              .sort(() => 0.5 - Math.random())
              .slice(0, numSymptoms);

            for (const symptom of selectedSymptoms) {
              await db.insert(dailyLogSymptoms).values({
                dailyLogId: dailyLog[0].id,
                symptomId: symptom.id,
                severity: getRandomNumber(1, 5),
                notes:
                  Math.random() < 0.5
                    ? `${symptom.name} was troublesome`
                    : null,
              });
            }
          }
        } else if (i <= 7) {
          // Break current streak if missed recent days
          streakCount = 0;
        }
      }

      // Update user streaks
      await db
        .update(streaks)
        .set({
          currentStreak: streakCount,
          longestStreak: Math.max(
            streakCount,
            getRandomNumber(streakCount, streakCount + 10)
          ),
          updatedAt: new Date(),
        })
        .where(eq(streaks.userId, user.id));

      // Award some badges based on activity
      const badgesToAward = [];

      if (totalLogs >= 1)
        badgesToAward.push(badgeRecords.find((b) => b.name === "First Log"));
      if (streakCount >= 7)
        badgesToAward.push(badgeRecords.find((b) => b.name === "Week Warrior"));
      if (totalLogs >= 30)
        badgesToAward.push(badgeRecords.find((b) => b.name === "Month Master"));
      if (cycleRecords.length >= 1)
        badgesToAward.push(
          badgeRecords.find((b) => b.name === "Cycle Tracker")
        );

      const painLogs = dailyLogsData.filter(
        (log) => log.painLevel && log.painLevel > 0
      ).length;
      if (painLogs >= 10)
        badgesToAward.push(badgeRecords.find((b) => b.name === "Pain Warrior"));

      for (const badge of badgesToAward) {
        if (badge) {
          await db.insert(userBadges).values({
            userId: user.id,
            badgeId: badge.id,
            earnedAt: new Date(),
          });
        }
      }

      console.log(`   ✅ Created ${totalLogs} daily logs`);
      console.log(`   ✅ Created ${cycleRecords.length} cycles`);
      console.log(`   ✅ Awarded ${badgesToAward.length} badges`);
      console.log(`   ✅ Current streak: ${streakCount} days`);
    }

    console.log("\n🎉 User data seeding completed successfully!");
    console.log("\n📋 Summary:");
    console.log("==========================================");
    console.log(`✅ Seeded data for ${testUsers.length} users`);
    console.log("✅ Created realistic daily logs for 60 days");
    console.log("✅ Generated cycle and period data");
    console.log("✅ Added symptoms and mood tracking");
    console.log("✅ Awarded achievement badges");
    console.log("✅ Updated streak counters");
    console.log("==========================================\n");
  } catch (error) {
    console.error("❌ Error seeding user data:", error);
    throw error;
  }
}

// Run if this file is executed directly
if (require.main === module) {
  seedUserData()
    .then(() => {
      console.log("✅ User data seeding completed");
      process.exit(0);
    })
    .catch((error) => {
      console.error("❌ User data seeding failed:", error);
      process.exit(1);
    });
}
