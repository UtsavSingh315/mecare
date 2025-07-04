# MeCare Database Integration

This document provides instructions for setting up and using the complete database integration for the MeCare period tracking application.

## 🚀 Quick Start

### 1. Environment Setup

Copy the example environment file and configure it:

```bash
cp .env.example .env.local
```

Edit `.env.local` with your database credentials:

```bash
DATABASE_URL="postgresql://username:password@localhost:5432/mecare_db"
NODE_ENV="development"
```

### 2. Database Setup

Initialize your database with all tables and seed data:

```bash
npm run db:init
```

This command will:

- Run all database migrations
- Create all required tables
- Seed the database with initial data (symptoms, badges, affirmations, challenges)

### 3. Development Commands

```bash
# Generate new migrations (after schema changes)
npm run db:generate

# Push schema changes directly to database
npm run db:push

# Run migrations manually
npm run db:migrate

# Seed database with initial data
npm run db:seed

# Open Drizzle Studio (database browser)
npm run db:studio
```

## 📊 API Endpoints

### Health Check

```
GET /api/health
```

Returns database connection status.

### Daily Logs

```
POST /api/daily-logs
GET /api/daily-logs?userId=xxx&date=2025-07-04
```

### User Dashboard

```
GET /api/users/[userId]/dashboard
```

Returns user profile, streaks, and badges.

### Cycle Predictions

```
GET /api/users/[userId]/predictions
POST /api/users/[userId]/predictions
```

## 🏗️ Database Schema

### Core Tables

- **users** - User authentication and basic info
- **user_profiles** - Cycle preferences and settings
- **cycles** - Menstrual cycle tracking
- **period_days** - Individual period days with flow
- **daily_logs** - Daily health and mood logging
- **symptoms** - Predefined and custom symptoms

### Gamification

- **badges** - Achievement system
- **user_badges** - User-earned badges
- **streaks** - Streak tracking (logging, water, exercise)
- **challenges** - Monthly/weekly challenges

### Analytics

- **cycle_predictions** - AI-generated predictions
- **user_insights** - Monthly analytics

### Content

- **affirmations** - Daily motivational messages
- **reminder_settings** - User notification preferences

## 🔧 Integration Examples

### Creating a Daily Log

```typescript
// In your component
import { useApiCall } from "@/hooks/use-database";

const { apiCall, loading, error } = useApiCall();

const createLog = async (logData) => {
  try {
    const result = await apiCall("/api/daily-logs", {
      method: "POST",
      body: JSON.stringify({
        userId: "user-id",
        date: "2025-07-04",
        mood: "happy",
        painLevel: 2,
        energyLevel: 8,
        waterIntake: 10,
        isOnPeriod: true,
        symptoms: ["symptom-id-1", "symptom-id-2"],
        notes: "Feeling great today!",
      }),
    });
    console.log("Log created:", result);
  } catch (err) {
    console.error("Failed to create log:", err);
  }
};
```

### Getting User Dashboard Data

```typescript
const fetchDashboard = async (userId: string) => {
  try {
    const result = await apiCall(`/api/users/${userId}/dashboard`);
    const { profile, streaks, badges } = result.data;

    // Use the data in your component
    setUserProfile(profile);
    setUserStreaks(streaks);
    setUserBadges(badges);
  } catch (err) {
    console.error("Failed to fetch dashboard:", err);
  }
};
```

### Database Status Monitoring

```typescript
// In your layout or main component
import { useDatabaseStatus } from "@/hooks/use-database";

function App() {
  const { connected, loading, error } = useDatabaseStatus();

  if (loading) return <div>Checking database connection...</div>;
  if (!connected) return <div>Database unavailable: {error}</div>;

  return <YourAppContent />;
}
```

## 🛠️ Direct Database Usage

For server-side operations, you can use the database utilities directly:

```typescript
import {
  createDailyLog,
  getUserProfile,
  generateCyclePredictions,
  checkAndAwardBadges,
} from "@/lib/db/utils";

// In your API routes or server components
const dailyLog = await createDailyLog(userId, logData);
const profile = await getUserProfile(userId);
const predictions = await generateCyclePredictions(userId);
const newBadges = await checkAndAwardBadges(userId);
```

## 🔄 Data Migration

When making schema changes:

1. Update your schema in `lib/db/schema.ts`
2. Generate migration: `npm run db:generate`
3. Review the generated migration in `lib/db/migrations/`
4. Apply migration: `npm run db:migrate`

## 🏥 Health Monitoring

The application includes built-in health monitoring:

- Database connection status
- API endpoint monitoring
- Error logging and handling
- Graceful degradation when database is unavailable

## 🔐 Security Features

- UUID primary keys for better security
- Proper foreign key relationships
- Input validation and sanitization
- Environment variable protection
- CORS headers configuration

## 📈 Performance Features

- Proper database indexing
- Connection pooling
- Query optimization
- Caching strategies ready for implementation

## 🚨 Troubleshooting

### Database Connection Issues

1. Check your `DATABASE_URL` in `.env.local`
2. Ensure PostgreSQL is running
3. Verify database credentials
4. Check network connectivity

### Migration Errors

1. Ensure database is accessible
2. Check for conflicting schema changes
3. Review migration files for syntax errors
4. Try pushing schema directly: `npm run db:push`

### Seeding Issues

1. Ensure migrations have run first
2. Check for duplicate data constraints
3. Verify foreign key relationships

## 📚 Additional Resources

- [Drizzle ORM Documentation](https://orm.drizzle.team/)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Next.js API Routes](https://nextjs.org/docs/app/building-your-application/routing/route-handlers)

This integration provides a complete, production-ready database layer for your MeCare application with all the features from your frontend fully supported.
