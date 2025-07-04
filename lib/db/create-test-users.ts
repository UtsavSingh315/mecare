// Load environment variables first
import dotenv from "dotenv";
import { resolve } from "path";

// Load .env.local file
dotenv.config({ path: resolve(process.cwd(), ".env.local") });

import bcrypt from "bcryptjs";
import { db } from "./index";
import { users, userProfiles, userSettings, streaks } from "./schema";

const testUsers = [
  {
    name: "Sarah Johnson",
    email: "sarah@example.com",
    password: "password123",
    age: 28,
    averageCycleLength: 28,
    averagePeriodLength: 5,
  },
  {
    name: "Emma Wilson",
    email: "emma@example.com",
    password: "password123",
    age: 25,
    averageCycleLength: 30,
    averagePeriodLength: 4,
  },
  {
    name: "Maya Chen",
    email: "maya@example.com",
    password: "password123",
    age: 32,
    averageCycleLength: 26,
    averagePeriodLength: 6,
  },
  {
    name: "Alex Rodriguez",
    email: "alex@example.com",
    password: "password123",
    age: 29,
    averageCycleLength: 29,
    averagePeriodLength: 5,
  },
  {
    name: "Jessica Taylor",
    email: "jessica@example.com",
    password: "password123",
    age: 27,
    averageCycleLength: 31,
    averagePeriodLength: 4,
  },
  {
    name: "Maria Lopez",
    email: "maria@example.com",
    password: "password123",
    age: 24,
    averageCycleLength: 35,
    averagePeriodLength: 6,
  },
];

export async function createTestUsers() {
  try {
    console.log("🔐 Creating test users...");

    for (const userData of testUsers) {
      // Check if user already exists
      const existingUser = await db.query.users.findFirst({
        where: (users, { eq }) => eq(users.email, userData.email),
      });

      if (existingUser) {
        console.log(`⏭️  User ${userData.email} already exists, skipping...`);
        continue;
      }

      // Hash the password
      const saltRounds = 10;
      const passwordHash = await bcrypt.hash(userData.password, saltRounds);

      // Create user
      const [newUser] = await db
        .insert(users)
        .values({
          name: userData.name,
          email: userData.email,
          passwordHash: passwordHash,
          age: userData.age,
          isEmailVerified: true, // Set to true for test users
        })
        .returning();

      console.log(`✅ Created user: ${userData.name} (${userData.email})`);

      // Create user profile
      await db.insert(userProfiles).values({
        userId: newUser.id,
        averageCycleLength: userData.averageCycleLength,
        averagePeriodLength: userData.averagePeriodLength,
        timezone: "UTC",
      });

      // Create user settings
      await db.insert(userSettings).values([
        {
          userId: newUser.id,
          key: "theme",
          value: "light",
        },
        {
          userId: newUser.id,
          key: "language",
          value: "en",
        },
        {
          userId: newUser.id,
          key: "privacySettings",
          value: {
            appLock: false,
            analytics: true,
          },
        },
        {
          userId: newUser.id,
          key: "dataRetentionDays",
          value: 365,
        },
      ]);

      // Initialize streaks
      const streakTypes = ["logging", "water", "exercise"];
      for (const type of streakTypes) {
        await db.insert(streaks).values({
          userId: newUser.id,
          type: type,
          currentStreak: 0,
          longestStreak: 0,
        });
      }

      console.log(`   📊 Created profile and settings for ${userData.name}`);
    }

    console.log("\n🎉 Test users created successfully!");
    console.log("\n📋 Login Credentials:");
    console.log("==========================================");
    testUsers.forEach((user) => {
      console.log(`Email: ${user.email}`);
      console.log(`Password: ${user.password}`);
      console.log(`Name: ${user.name}`);
      console.log("------------------------------------------");
    });
    console.log("==========================================\n");
  } catch (error) {
    console.error("❌ Error creating test users:", error);
    throw error;
  }
}

// Run if this file is executed directly
if (require.main === module) {
  createTestUsers()
    .then(() => {
      console.log("✅ Test user creation completed");
      process.exit(0);
    })
    .catch((error) => {
      console.error("❌ Test user creation failed:", error);
      process.exit(1);
    });
}
