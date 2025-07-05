// Load environment variables first
import dotenv from "dotenv";
import { resolve } from "path";

// Load .env.local file
dotenv.config({ path: resolve(process.cwd(), ".env.local") });

import { client } from "./index";

async function migrateUserSettings() {
  console.log("Migrating user_settings table...");

  try {
    // Add key and value columns if they don't exist
    await client`
      ALTER TABLE user_settings 
      ADD COLUMN IF NOT EXISTS key varchar(100),
      ADD COLUMN IF NOT EXISTS value jsonb;
    `;

    console.log("Migration completed successfully");
  } catch (error) {
    console.error("Migration failed:", error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

migrateUserSettings();
