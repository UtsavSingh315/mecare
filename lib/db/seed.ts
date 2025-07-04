// Load environment variables first
import dotenv from "dotenv";
import { resolve } from "path";

// Load .env.local file
dotenv.config({ path: resolve(process.cwd(), ".env.local") });

import { db } from "./index";
import { symptoms, badges, challenges, affirmations } from "./schema";

// Default symptoms that come pre-loaded
const defaultSymptoms = [
  { name: "Cramps", category: "physical", isDefault: true },
  { name: "Headache", category: "physical", isDefault: true },
  { name: "Fatigue", category: "physical", isDefault: true },
  { name: "Back Pain", category: "physical", isDefault: true },
  { name: "Breast Tenderness", category: "physical", isDefault: true },
  { name: "Bloating", category: "physical", isDefault: true },
  { name: "Mood Swings", category: "emotional", isDefault: true },
  { name: "Irritability", category: "emotional", isDefault: true },
  { name: "Anxiety", category: "emotional", isDefault: true },
  { name: "Depression", category: "emotional", isDefault: true },
  { name: "Nausea", category: "physical", isDefault: true },
  { name: "Dizziness", category: "physical", isDefault: true },
  { name: "Hot Flashes", category: "physical", isDefault: true },
  { name: "Acne", category: "physical", isDefault: true },
  { name: "Constipation", category: "physical", isDefault: true },
  { name: "Diarrhea", category: "physical", isDefault: true },
  { name: "Food Cravings", category: "physical", isDefault: true },
  { name: "Sleep Issues", category: "physical", isDefault: true },
  { name: "Concentration Issues", category: "cognitive", isDefault: true },
  { name: "Memory Problems", category: "cognitive", isDefault: true },
];

// Default badges for gamification
const defaultBadges = [
  {
    name: "First Log!",
    description: "Completed your first daily log",
    icon: "🎉",
    category: "milestone",
    requirement: { type: "daily_logs_count", value: 1 },
    isActive: true,
  },
  {
    name: "7 Day Streak",
    description: "Logged data for 7 consecutive days",
    icon: "🔥",
    category: "streak",
    requirement: { type: "consecutive_logs", value: 7 },
    isActive: true,
  },
  {
    name: "30 Day Streak",
    description: "Logged data for 30 consecutive days",
    icon: "🏆",
    category: "streak",
    requirement: { type: "consecutive_logs", value: 30 },
    isActive: true,
  },
  {
    name: "Symptom Tracker",
    description: "Logged symptoms for 5 different days",
    icon: "📊",
    category: "health",
    requirement: { type: "symptom_logs", value: 5 },
    isActive: true,
  },
  {
    name: "Water Warrior",
    description: "Drank 8+ glasses of water for 10 days",
    icon: "💧",
    category: "health",
    requirement: { type: "water_target", value: 10, daily_target: 8 },
    isActive: true,
  },
  {
    name: "Mood Master",
    description: "Tracked mood for 20 different days",
    icon: "😊",
    category: "health",
    requirement: { type: "mood_logs", value: 20 },
    isActive: true,
  },
  {
    name: "Goal Achiever",
    description: "Completed your first monthly challenge",
    icon: "🎯",
    category: "milestone",
    requirement: { type: "challenge_completed", value: 1 },
    isActive: true,
  },
  {
    name: "Consistency Queen",
    description: "Logged data for 50 total days",
    icon: "👑",
    category: "milestone",
    requirement: { type: "total_logs", value: 50 },
    isActive: true,
  },
  {
    name: "Health Hero",
    description: "Completed 100 daily logs",
    icon: "🦸‍♀️",
    category: "milestone",
    requirement: { type: "total_logs", value: 100 },
    isActive: true,
  },
  {
    name: "Year Long Journey",
    description: "Active user for 365 days",
    icon: "🌟",
    category: "milestone",
    requirement: { type: "days_active", value: 365 },
    isActive: true,
  },
];

// Default challenges
const defaultChallenges = [
  {
    name: "Monthly Logger",
    description: "Log your daily data for 25 days this month",
    type: "monthly",
    target: 25,
    targetType: "days_logged",
    startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
      .toISOString()
      .split("T")[0],
    endDate: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0)
      .toISOString()
      .split("T")[0],
    isActive: true,
  },
  {
    name: "Hydration Hero",
    description: "Drink at least 8 glasses of water for 20 days this month",
    type: "monthly",
    target: 20,
    targetType: "water_target_days",
    startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
      .toISOString()
      .split("T")[0],
    endDate: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0)
      .toISOString()
      .split("T")[0],
    isActive: true,
  },
  {
    name: "Weekly Wellness",
    description: "Complete 7 consecutive days of logging",
    type: "weekly",
    target: 7,
    targetType: "consecutive_logs",
    startDate: new Date().toISOString().split("T")[0],
    endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split("T")[0],
    isActive: true,
  },
];

// Motivational affirmations
const defaultAffirmations = [
  {
    message: "You're doing great, keep it up! 💪",
    category: "motivation",
    isActive: true,
  },
  {
    message: "Your body is amazing and you're taking great care of it! 🌸",
    category: "body-positive",
    isActive: true,
  },
  {
    message: "Every day you track is a step towards better health! ✨",
    category: "motivation",
    isActive: true,
  },
  {
    message: "You're strong, beautiful, and in control! 🌺",
    category: "body-positive",
    isActive: true,
  },
  {
    message: "Listen to your body - it's telling you important things! 🦋",
    category: "self-care",
    isActive: true,
  },
  {
    message: "Self-care isn't selfish, it's essential! 💕",
    category: "self-care",
    isActive: true,
  },
  {
    message: "You're creating healthy habits that will last a lifetime! 🌟",
    category: "motivation",
    isActive: true,
  },
  {
    message: "Your health journey is unique and beautiful! 🌈",
    category: "body-positive",
    isActive: true,
  },
  {
    message:
      "Taking time to track your health shows how much you value yourself! 💝",
    category: "self-care",
    isActive: true,
  },
  {
    message: "You're building a deeper connection with your body every day! 🤗",
    category: "body-positive",
    isActive: true,
  },
  {
    message: "Small daily actions lead to big positive changes! 🌱",
    category: "motivation",
    isActive: true,
  },
  {
    message: "Your dedication to your health is inspiring! ⭐",
    category: "motivation",
    isActive: true,
  },
  {
    message: "Trust your body's wisdom - you know yourself best! 🧘‍♀️",
    category: "self-care",
    isActive: true,
  },
  {
    message: "Every cycle teaches you something new about yourself! 📚",
    category: "body-positive",
    isActive: true,
  },
  {
    message: "You're not just tracking data, you're honoring your health! 🙏",
    category: "self-care",
    isActive: true,
  },
];

export async function seedDatabase() {
  try {
    console.log("Starting database seeding...");

    // Seed symptoms
    console.log("Seeding symptoms...");
    for (const symptom of defaultSymptoms) {
      await db.insert(symptoms).values(symptom).onConflictDoNothing();
    }

    // Seed badges
    console.log("Seeding badges...");
    for (const badge of defaultBadges) {
      await db.insert(badges).values(badge).onConflictDoNothing();
    }

    // Seed challenges
    console.log("Seeding challenges...");
    for (const challenge of defaultChallenges) {
      await db.insert(challenges).values(challenge).onConflictDoNothing();
    }

    // Seed affirmations
    console.log("Seeding affirmations...");
    for (const affirmation of defaultAffirmations) {
      await db.insert(affirmations).values(affirmation).onConflictDoNothing();
    }

    console.log("Database seeding completed successfully!");
  } catch (error) {
    console.error("Error seeding database:", error);
    throw error;
  }
}

// Run seeding if this file is executed directly
if (require.main === module) {
  seedDatabase()
    .then(() => {
      console.log("Seeding finished");
      process.exit(0);
    })
    .catch((error) => {
      console.error("Seeding failed:", error);
      process.exit(1);
    });
}
