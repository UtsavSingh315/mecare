import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

const JWT_SECRET =
  process.env.JWT_SECRET ||
  "your-very-secure-secret-key-change-this-in-production";

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

// JWT token verification
export async function verifyToken(token: string): Promise<UserSession | null> {
  try {
    // Verify JWT token
    const decoded = jwt.verify(token, JWT_SECRET) as {
      userId?: string;
      id?: string;
      exp: number;
    };

    // Support both userId and id fields for backward compatibility
    const userId = decoded.userId || decoded.id;
    if (!userId) {
      return null;
    }

    // Check if token is expired (JWT already handles this, but being explicit)
    if (decoded.exp && decoded.exp < Date.now() / 1000) {
      return null;
    }

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

// Generate a JWT token
export function generateToken(userId: string): string {
  return jwt.sign(
    { userId },
    JWT_SECRET,
    { expiresIn: "7d" } // Token expires in 7 days
  );
}
