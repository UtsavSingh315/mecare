#!/usr/bin/env tsx

// Load environment variables first
import dotenv from "dotenv";
import { resolve } from "path";

// Load .env.local file
dotenv.config({ path: resolve(process.cwd(), ".env.local") });

import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";
import { seedDatabase } from "./seed";

async function initializeDatabase() {
  console.log("🚀 Initializing MeCare Database...");

  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    console.error("❌ DATABASE_URL environment variable is required");
    process.exit(1);
  }

  console.log("📦 Connecting to database...");
  const client = postgres(connectionString, { max: 1 });
  const db = drizzle(client);

  try {
    // Run migrations
    console.log("🔄 Running database migrations...");
    await migrate(db, { migrationsFolder: "./lib/db/migrations" });
    console.log("✅ Migrations completed successfully");

    // Seed the database
    console.log("🌱 Seeding database with initial data...");
    await seedDatabase();
    console.log("✅ Database seeded successfully");

    console.log("🎉 Database initialization completed successfully!");
  } catch (error) {
    console.error("❌ Database initialization failed:", error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

// Run initialization if this file is executed directly
if (require.main === module) {
  initializeDatabase();
}

export { initializeDatabase };
