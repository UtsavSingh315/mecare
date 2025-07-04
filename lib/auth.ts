import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface UserSession {
  id: string;
  name: string;
  email: string;
  age: number | null;
  isEmailVerified: boolean;
}

export async function authenticateUser(
  credentials: LoginCredentials
): Promise<UserSession | null> {
  try {
    // Find user by email
    const user = await db.query.users.findFirst({
      where: eq(users.email, credentials.email.toLowerCase()),
    });

    if (!user) {
      return null; // User not found
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(
      credentials.password,
      user.passwordHash
    );

    if (!isPasswordValid) {
      return null; // Invalid password
    }

    // Return user session data (without password hash)
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      age: user.age,
      isEmailVerified: user.isEmailVerified || false,
    };
  } catch (error) {
    console.error("Authentication error:", error);
    return null;
  }
}

export async function hashPassword(password: string): Promise<string> {
  const saltRounds = 10;
  return await bcrypt.hash(password, saltRounds);
}

export async function verifyPassword(
  password: string,
  hash: string
): Promise<boolean> {
  return await bcrypt.compare(password, hash);
}

export async function getUserById(userId: string): Promise<UserSession | null> {
  try {
    const user = await db.query.users.findFirst({
      where: eq(users.id, userId),
    });

    if (!user) {
      return null;
    }

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      age: user.age,
      isEmailVerified: user.isEmailVerified || false,
    };
  } catch (error) {
    console.error("Error fetching user:", error);
    return null;
  }
}

export async function createUser(userData: {
  name: string;
  email: string;
  password: string;
  age?: number;
}): Promise<UserSession | null> {
  try {
    // Check if user already exists
    const existingUser = await db.query.users.findFirst({
      where: eq(users.email, userData.email.toLowerCase()),
    });

    if (existingUser) {
      throw new Error("User already exists");
    }

    // Hash password
    const passwordHash = await hashPassword(userData.password);

    // Create user
    const [newUser] = await db
      .insert(users)
      .values({
        name: userData.name,
        email: userData.email.toLowerCase(),
        passwordHash,
        age: userData.age,
        isEmailVerified: false,
      })
      .returning();

    return {
      id: newUser.id,
      name: newUser.name,
      email: newUser.email,
      age: newUser.age,
      isEmailVerified: newUser.isEmailVerified || false,
    };
  } catch (error) {
    console.error("Error creating user:", error);
    return null;
  }
}

// Simple token verification (in production, use JWT)
export async function verifyToken(token: string): Promise<UserSession | null> {
  try {
    // For simplicity, we're using base64 encoded user ID as token
    // In production, use proper JWT tokens
    const userId = Buffer.from(token, "base64").toString("utf-8");

    const user = await db.query.users.findFirst({
      where: eq(users.id, userId),
    });

    if (!user) {
      return null;
    }

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      age: user.age,
      isEmailVerified: user.isEmailVerified || false,
    };
  } catch (error) {
    console.error("Token verification error:", error);
    return null;
  }
}

// Generate a simple token (in production, use JWT)
export function generateToken(userId: string): string {
  return Buffer.from(userId).toString("base64");
}
