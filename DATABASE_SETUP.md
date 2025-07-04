# Drizzle ORM Setup for MeCare App

This document outlines the Drizzle database setup for the MeCare period tracking application.

## Required Dependencies

Add these dependencies to your `package.json`:

```json
{
  "dependencies": {
    "drizzle-orm": "^0.29.0",
    "postgres": "^3.4.3",
    "@types/postgres": "^3.0.0"
  },
  "devDependencies": {
    "drizzle-kit": "^0.20.0"
  }
}
```

## Environment Variables

Add these to your `.env.local` file:

```bash
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/mecare_db"

# For development
NODE_ENV="development"
```

## Setup Instructions

### 1. Install Dependencies

```bash
npm install drizzle-orm postgres @types/postgres
npm install -D drizzle-kit
```

### 2. Database Setup

```bash
# Create database (using psql)
createdb mecare_db

# Or using Docker
docker run --name mecare-postgres -e POSTGRES_DB=mecare_db -e POSTGRES_USER=your_user -e POSTGRES_PASSWORD=your_password -p 5432:5432 -d postgres:15
```

### 3. Generate Migrations

```bash
npx drizzle-kit generate:pg
```

### 4. Run Migrations

```bash
npx drizzle-kit push:pg
# Or
npm run db:migrate
```

### 5. Seed Database

```bash
npm run db:seed
```

## Package.json Scripts

Add these scripts to your `package.json`:

```json
{
  "scripts": {
    "db:generate": "drizzle-kit generate:pg",
    "db:push": "drizzle-kit push:pg",
    "db:migrate": "tsx lib/db/migrate.ts",
    "db:seed": "tsx lib/db/seed.ts",
    "db:studio": "drizzle-kit studio"
  }
}
```

## Database Schema Overview

### Core Tables:

- **users**: User authentication and basic info
- **user_profiles**: User cycle preferences and settings
- **cycles**: Menstrual cycle tracking
- **period_days**: Individual period days with flow tracking
- **daily_logs**: Daily health and mood logging
- **symptoms**: Predefined and custom symptoms
- **daily_log_symptoms**: Many-to-many relationship for daily symptoms

### Gamification Tables:

- **badges**: Available achievement badges
- **user_badges**: User-earned badges
- **streaks**: User streak tracking (logging, water, exercise)
- **challenges**: Monthly/weekly challenges
- **user_challenges**: User challenge participation

### Analytics Tables:

- **cycle_predictions**: AI-generated cycle predictions
- **user_insights**: Monthly analytics and insights

### Notification Tables:

- **reminder_settings**: User reminder preferences
- **notifications**: Notification history

### Content Tables:

- **affirmations**: Daily motivational messages
- **user_affirmations**: User affirmation history

## Key Features Supported:

### 1. **Cycle Tracking**

- Complete menstrual cycle management
- Period day tracking with flow intensity
- Cycle length calculations
- Historical cycle data

### 2. **Daily Logging**

- Mood tracking (6 different moods)
- Pain and energy levels (0-10 scale)
- Water intake monitoring
- Sleep and exercise tracking
- Symptom logging with custom symptoms
- Notes and observations

### 3. **Predictions & Analytics**

- AI-powered cycle predictions
- Ovulation and fertility window calculations
- Monthly insights generation
- Symptom and mood pattern analysis

### 4. **Gamification**

- Achievement badge system
- Streak tracking for multiple activities
- Monthly and weekly challenges
- Progress tracking and rewards

### 5. **Personalization**

- Custom reminder settings
- Personalized affirmations
- User preference management
- Privacy and security settings

### 6. **Notifications**

- Period reminders
- Daily log reminders
- Pill reminders
- Water intake reminders
- Customizable timing and frequency

## Usage Examples:

### Creating a Daily Log

```typescript
import { createDailyLog } from "@/lib/db/utils";

const dailyLog = await createDailyLog("user-id", {
  date: "2025-07-04",
  mood: "happy",
  painLevel: 2,
  energyLevel: 8,
  waterIntake: 10,
  isOnPeriod: true,
  symptoms: ["symptom-id-1", "symptom-id-2"],
  notes: "Feeling great today!",
});
```

### Generating Cycle Predictions

```typescript
import { generateCyclePredictions } from "@/lib/db/utils";

const predictions = await generateCyclePredictions("user-id");
```

### Getting User Analytics

```typescript
import { generateUserInsights } from "@/lib/db/utils";

const insights = await generateUserInsights("user-id", 7, 2025); // July 2025
```

This schema provides a complete foundation for all the features present in the MeCare frontend application.
