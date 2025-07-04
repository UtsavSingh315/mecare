import { db } from "./index";
import {
  badges,
  userBadges,
  challenges,
  userChallenges,
  affirmations,
  userAffirmations,
  userInsights,
  streaks,
  users,
  dailyLogs,
  dailyLogSymptoms,
  symptoms,
} from "./schema";
import { eq, and, count, avg, desc, gte, lte } from "drizzle-orm";

async function seedAppData() {
  console.log("🌱 Starting comprehensive app data seeding...");

  try {
    // 1. Create default badges
    console.log("📛 Creating badges...");
    const badgeData = [
      {
        name: "First Log",
        description: "Logged your first day of data",
        icon: "🌟",
        category: "milestone",
        requirement: { type: "first_log" },
      },
      {
        name: "7-Day Streak",
        description: "Logged data for 7 consecutive days",
        icon: "🔥",
        category: "streak",
        requirement: { type: "streak", days: 7 },
      },
      {
        name: "30-Day Streak",
        description: "Logged data for 30 consecutive days",
        icon: "💪",
        category: "streak",
        requirement: { type: "streak", days: 30 },
      },
      {
        name: "Period Tracker",
        description: "Tracked your first period",
        icon: "🌸",
        category: "milestone",
        requirement: { type: "first_period" },
      },
      {
        name: "Symptom Logger",
        description: "Logged symptoms for 10 days",
        icon: "📊",
        category: "logging",
        requirement: { type: "symptom_logs", count: 10 },
      },
      {
        name: "Wellness Warrior",
        description: "Maintained consistent logging for 3 months",
        icon: "🏆",
        category: "milestone",
        requirement: { type: "consistent_logging", months: 3 },
      },
      {
        name: "Self-Care Champion",
        description: "Logged mood and energy for 20 days",
        icon: "💖",
        category: "health",
        requirement: { type: "mood_energy_logs", count: 20 },
      },
      {
        name: "Data Detective",
        description: "Viewed insights page 5 times",
        icon: "🔍",
        category: "engagement",
        requirement: { type: "insights_views", count: 5 },
      },
    ];

    const insertedBadges = await db.insert(badges).values(badgeData).returning();
    console.log(`✅ Created ${insertedBadges.length} badges`);

    // 2. Create default challenges
    console.log("🎯 Creating challenges...");
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth();
    const currentYear = currentDate.getFullYear();
    
    const challengeData = [
      {
        name: "July Logging Challenge",
        description: "Log your health data for 25 days this month",
        type: "monthly",
        target: 25,
        targetType: "days_logged",
        startDate: new Date(currentYear, currentMonth, 1).toISOString().split('T')[0],
        endDate: new Date(currentYear, currentMonth + 1, 0).toISOString().split('T')[0],
        isActive: true,
      },
      {
        name: "Mood Tracker Weekly",
        description: "Track your mood every day this week",
        type: "weekly",
        target: 7,
        targetType: "mood_logs",
        startDate: new Date(currentYear, currentMonth, Math.max(1, currentDate.getDate() - currentDate.getDay())).toISOString().split('T')[0],
        endDate: new Date(currentYear, currentMonth, Math.max(7, currentDate.getDate() - currentDate.getDay() + 6)).toISOString().split('T')[0],
        isActive: true,
      },
      {
        name: "Hydration Hero",
        description: "Drink 8 glasses of water daily for a week",
        type: "weekly",
        target: 56,
        targetType: "water_glasses",
        startDate: new Date(currentYear, currentMonth, currentDate.getDate()).toISOString().split('T')[0],
        endDate: new Date(currentYear, currentMonth, currentDate.getDate() + 6).toISOString().split('T')[0],
        isActive: true,
      },
      {
        name: "Fitness Focus",
        description: "Exercise for 150 minutes this month",
        type: "monthly",
        target: 150,
        targetType: "exercise_minutes",
        startDate: new Date(currentYear, currentMonth, 1).toISOString().split('T')[0],
        endDate: new Date(currentYear, currentMonth + 1, 0).toISOString().split('T')[0],
        isActive: true,
      },
    ];

    const insertedChallenges = await db.insert(challenges).values(challengeData).returning();
    console.log(`✅ Created ${insertedChallenges.length} challenges`);

    // 3. Create affirmations
    console.log("💭 Creating affirmations...");
    const affirmationData = [
      {
        message: "Your body is wise and knows how to heal itself.",
        category: "body-positive",
        isActive: true,
      },
      {
        message: "You are worthy of love and care, especially from yourself.",
        category: "self-care",
        isActive: true,
      },
      {
        message: "Every cycle is a reminder of your body's incredible strength.",
        category: "body-positive",
        isActive: true,
      },
      {
        message: "Taking time to rest is not laziness, it's necessary self-care.",
        category: "self-care",
        isActive: true,
      },
      {
        message: "You are more resilient than you know.",
        category: "motivation",
        isActive: true,
      },
      {
        message: "Your feelings are valid, and it's okay to honor them.",
        category: "emotional",
        isActive: true,
      },
      {
        message: "Progress, not perfection, is what matters.",
        category: "motivation",
        isActive: true,
      },
      {
        message: "You are learning to listen to your body's signals.",
        category: "body-positive",
        isActive: true,
      },
      {
        message: "Today is a new opportunity to care for yourself.",
        category: "motivation",
        isActive: true,
      },
      {
        message: "Your journey of self-discovery is beautiful and unique.",
        category: "self-care",
        isActive: true,
      },
      {
        message: "You have the power to make choices that honor your wellbeing.",
        category: "empowerment",
        isActive: true,
      },
      {
        message: "Tracking your patterns helps you understand yourself better.",
        category: "motivation",
        isActive: true,
      },
      {
        message: "Your body deserves kindness and compassion.",
        category: "body-positive",
        isActive: true,
      },
      {
        message: "It's okay to have difficult days. Tomorrow is a fresh start.",
        category: "emotional",
        isActive: true,
      },
      {
        message: "You are becoming more in tune with your body's needs.",
        category: "body-positive",
        isActive: true,
      },
    ];

    const insertedAffirmations = await db.insert(affirmations).values(affirmationData).returning();
    console.log(`✅ Created ${insertedAffirmations.length} affirmations`);

    // 4. Get all users and create user-specific data
    const allUsers = await db.select().from(users);
    console.log(`👥 Found ${allUsers.length} users`);

    for (const user of allUsers) {
      console.log(`Processing user: ${user.name} (${user.id})`);

      // Get user's daily logs to calculate realistic data
      const userLogs = await db
        .select()
        .from(dailyLogs)
        .where(eq(dailyLogs.userId, user.id))
        .orderBy(desc(dailyLogs.date));

      // Get user's symptoms data
      const userSymptoms = await db
        .select({
          symptomName: symptoms.name,
          count: count(dailyLogSymptoms.id),
        })
        .from(dailyLogSymptoms)
        .innerJoin(symptoms, eq(dailyLogSymptoms.symptomId, symptoms.id))
        .innerJoin(dailyLogs, eq(dailyLogSymptoms.dailyLogId, dailyLogs.id))
        .where(eq(dailyLogs.userId, user.id))
        .groupBy(symptoms.name)
        .orderBy(desc(count(dailyLogSymptoms.id)));

      // 5. Award appropriate badges based on user activity
      console.log(`  📛 Awarding badges for ${user.name}...`);
      const userBadgeData = [];

      // First Log badge
      if (userLogs.length > 0) {
        const firstLogBadge = insertedBadges.find(b => b.name === "First Log");
        if (firstLogBadge) {
          userBadgeData.push({
            userId: user.id,
            badgeId: firstLogBadge.id,
            earnedAt: new Date(userLogs[userLogs.length - 1].date + "T12:00:00Z"),
          });
        }
      }

      // Period Tracker badge
      if (userLogs.some(log => log.isOnPeriod)) {
        const periodBadge = insertedBadges.find(b => b.name === "Period Tracker");
        if (periodBadge) {
          userBadgeData.push({
            userId: user.id,
            badgeId: periodBadge.id,
            earnedAt: new Date(),
          });
        }
      }

      // Symptom Logger badge
      if (userSymptoms.length >= 3) {
        const symptomBadge = insertedBadges.find(b => b.name === "Symptom Logger");
        if (symptomBadge) {
          userBadgeData.push({
            userId: user.id,
            badgeId: symptomBadge.id,
            earnedAt: new Date(),
          });
        }
      }

      // 7-Day Streak badge
      if (userLogs.length >= 7) {
        const streakBadge = insertedBadges.find(b => b.name === "7-Day Streak");
        if (streakBadge) {
          userBadgeData.push({
            userId: user.id,
            badgeId: streakBadge.id,
            earnedAt: new Date(),
          });
        }
      }

      // Self-Care Champion badge
      const moodEnergyLogs = userLogs.filter(log => log.mood || log.energyLevel);
      if (moodEnergyLogs.length >= 10) {
        const selfCareBadge = insertedBadges.find(b => b.name === "Self-Care Champion");
        if (selfCareBadge) {
          userBadgeData.push({
            userId: user.id,
            badgeId: selfCareBadge.id,
            earnedAt: new Date(),
          });
        }
      }

      if (userBadgeData.length > 0) {
        await db.insert(userBadges).values(userBadgeData);
        console.log(`    ✅ Awarded ${userBadgeData.length} badges`);
      }

      // 6. Join user to active challenges
      console.log(`  🎯 Joining challenges for ${user.name}...`);
      const userChallengeData = insertedChallenges.map(challenge => ({
        userId: user.id,
        challengeId: challenge.id,
        currentProgress: Math.floor(Math.random() * (challenge.target * 0.7)), // Random progress up to 70%
        isCompleted: false,
        joinedAt: new Date(),
      }));

      if (userChallengeData.length > 0) {
        await db.insert(userChallenges).values(userChallengeData);
        console.log(`    ✅ Joined ${userChallengeData.length} challenges`);
      }

      // 7. Show some affirmations to user
      console.log(`  💭 Adding affirmations for ${user.name}...`);
      const randomAffirmations = insertedAffirmations
        .sort(() => 0.5 - Math.random())
        .slice(0, 5); // Show 5 random affirmations

      const userAffirmationData = randomAffirmations.map((affirmation, index) => ({
        userId: user.id,
        affirmationId: affirmation.id,
        shownAt: new Date(Date.now() - (index * 24 * 60 * 60 * 1000)), // Show over the last 5 days
        liked: Math.random() > 0.5, // Random likes
      }));

      if (userAffirmationData.length > 0) {
        await db.insert(userAffirmations).values(userAffirmationData);
        console.log(`    ✅ Added ${userAffirmationData.length} affirmations`);
      }

      // 8. Create user insights for current month
      console.log(`  📊 Creating insights for ${user.name}...`);
      
      // Calculate mood frequencies
      const moodCounts: Record<string, number> = {};
      userLogs.forEach(log => {
        if (log.mood) {
          moodCounts[log.mood] = (moodCounts[log.mood] || 0) + 1;
        }
      });

      // Calculate averages
      const periodsLogged = userLogs.filter(log => log.isOnPeriod).length;
      const totalPainLevels = userLogs.filter(log => log.painLevel !== null);
      const totalEnergyLevels = userLogs.filter(log => log.energyLevel !== null);
      const totalWaterLogs = userLogs.filter(log => log.waterIntake !== null);

      const avgPainLevel = totalPainLevels.length > 0
        ? totalPainLevels.reduce((sum, log) => sum + (log.painLevel || 0), 0) / totalPainLevels.length
        : 0;

      const avgEnergyLevel = totalEnergyLevels.length > 0
        ? totalEnergyLevels.reduce((sum, log) => sum + (log.energyLevel || 0), 0) / totalEnergyLevels.length
        : 5;

      const avgWaterIntake = totalWaterLogs.length > 0
        ? totalWaterLogs.reduce((sum, log) => sum + (log.waterIntake || 0), 0) / totalWaterLogs.length
        : 0;

      // Convert mood counts to display format
      const moodDistribution = Object.entries(moodCounts).map(([mood, count]) => ({
        name: mood.charAt(0).toUpperCase() + mood.slice(1),
        frequency: count,
      }));

      // Convert symptoms to display format
      const mostCommonSymptoms = userSymptoms.map(s => ({
        name: s.symptomName,
        frequency: Number(s.count),
      }));

      const userInsightData = {
        userId: user.id,
        month: currentMonth + 1,
        year: currentYear,
        totalDaysLogged: userLogs.length,
        averageMoodScore: moodDistribution.length > 0 ? "7.5" : null,
        averagePainLevel: avgPainLevel.toString(),
        averageEnergyLevel: avgEnergyLevel.toString(),
        averageWaterIntake: avgWaterIntake.toString(),
        mostCommonSymptoms: mostCommonSymptoms,
        moodDistribution: moodDistribution,
        periodDaysCount: periodsLogged,
        cycleConsistency: userLogs.length > 0 ? Math.min(95, (userLogs.length / 31) * 100).toString() : "0",
      };

      await db.insert(userInsights).values(userInsightData);
      console.log(`    ✅ Created insights`);

      // 9. Create/update user streaks
      console.log(`  🔥 Creating streaks for ${user.name}...`);
      const streakData = [
        {
          userId: user.id,
          type: "logging",
          currentStreak: Math.min(userLogs.length, 15), // Cap at 15 for realism
          longestStreak: Math.min(userLogs.length + 3, 25), // Slightly higher than current
          lastActivityDate: userLogs.length > 0 ? userLogs[0].date : null,
        }
      ];

      await db.insert(streaks).values(streakData);
      console.log(`    ✅ Created streaks`);
    }

    console.log("🎉 App data seeding completed successfully!");
    console.log(`
📊 Summary:
- ${insertedBadges.length} badges created
- ${insertedChallenges.length} challenges created  
- ${insertedAffirmations.length} affirmations created
- User-specific data created for ${allUsers.length} users
    `);

  } catch (error) {
    console.error("❌ Error seeding app data:", error);
    throw error;
  }
}

// Run if called directly
if (require.main === module) {
  seedAppData().then(() => {
    console.log("✅ Seeding completed!");
    process.exit(0);
  }).catch((error) => {
    console.error("❌ Seeding failed:", error);
    process.exit(1);
  });
}

export { seedAppData };
