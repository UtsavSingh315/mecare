import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

// Try to load environment variables if not already loaded
if (!process.env.DATABASE_URL) {
  try {
    const dotenv = require("dotenv");
    const path = require("path");
    dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });
  } catch (error) {
    // Ignore if dotenv is not available
  }
}

// Database connection configuration
const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error(
    "DATABASE_URL environment variable is required. Please check your .env.local file."
  );
}

// Create the postgres client
const client = postgres(connectionString, {
  max: 20, // Maximum number of connections
  idle_timeout: 20, // Close connections after 20 seconds of inactivity
  connect_timeout: 10, // Timeout after 10 seconds when connecting
});

// Create the Drizzle database instance
export const db = drizzle(client, {
  schema,
  logger: process.env.NODE_ENV === "development",
});

// Export the client for manual queries if needed
export { client };

// Export types
export type Database = typeof db;
