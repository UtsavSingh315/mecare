// Load environment variables first
import dotenv from "dotenv";
import { resolve } from "path";

// Load .env.local file
dotenv.config({ path: resolve(process.cwd(), ".env.local") });

import { db, client } from "./index";

async function checkSchema() {
  console.log("Checking database schema...");

  try {
    // Check if user_settings table exists
    const tableExists = await client`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'user_settings'
      );
    `;

    console.log("user_settings table exists:", tableExists[0].exists);

    if (tableExists[0].exists) {
      // Check columns in user_settings table
      const columns = await client`
        SELECT column_name, data_type, is_nullable 
        FROM information_schema.columns 
        WHERE table_name = 'user_settings' 
        ORDER BY ordinal_position;
      `;

      console.log("user_settings columns:", columns);
    }

    // List all tables
    const tables = await client`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name;
    `;

    console.log(
      "All tables:",
      tables.map((t) => t.table_name)
    );
  } catch (error) {
    console.error("Error checking schema:", error);
  } finally {
    await client.end();
  }
}

checkSchema();
