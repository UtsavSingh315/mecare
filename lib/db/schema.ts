import {
  pgTable,
  serial,
  varchar,
  text,
  timestamp,
  integer,
  boolean,
  date,
  decimal,
  jsonb,
  uuid,
  primaryKey,
  index,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// ==================== USER MANAGEMENT ====================

export const users = pgTable(
  "users",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    email: varchar("email", { length: 255 }).notNull().unique(),
    passwordHash: varchar("password_hash", { length: 255 }).notNull(),
    name: varchar("name", { length: 100 }).notNull(),
    age: integer("age"),
    isEmailVerified: boolean("is_email_verified").default(false),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    emailIdx: index("users_email_idx").on(table.email),
  })
);

export const userProfiles = pgTable(
  "user_profiles",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .references(() => users.id, { onDelete: "cascade" })
      .notNull(),
    averageCycleLength: integer("average_cycle_length").default(28).notNull(),
    averagePeriodLength: integer("average_period_length").default(5).notNull(),
    lastPeriodStart: date("last_period_start"),
    timezone: varchar("timezone", { length: 50 }).default("UTC"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    userIdIdx: index("user_profiles_user_id_idx").on(table.userId),
  })
);

// ==================== CYCLE TRACKING ====================

export const cycles = pgTable(
  "cycles",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .references(() => users.id, { onDelete: "cascade" })
      .notNull(),
    startDate: date("start_date").notNull(),
    endDate: date("end_date"), // null if cycle is ongoing
    cycleLength: integer("cycle_length"), // calculated when cycle ends
    periodLength: integer("period_length"), // calculated when period ends
    isActive: boolean("is_active").default(true),
    notes: text("notes"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    userIdIdx: index("cycles_user_id_idx").on(table.userId),
    startDateIdx: index("cycles_start_date_idx").on(table.startDate),
    activeIdx: index("cycles_active_idx").on(table.isActive),
  })
);

export const periodDays = pgTable(
  "period_days",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .references(() => users.id, { onDelete: "cascade" })
      .notNull(),
    cycleId: uuid("cycle_id").references(() => cycles.id, {
      onDelete: "cascade",
    }),
    date: date("date").notNull(),
    flowIntensity: varchar("flow_intensity", { length: 20 }), // 'light', 'medium', 'heavy'
    notes: text("notes"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => ({
    userDateIdx: index("period_days_user_date_idx").on(
      table.userId,
      table.date
    ),
    cycleIdIdx: index("period_days_cycle_id_idx").on(table.cycleId),
  })
);

// ==================== DAILY LOGGING ====================

export const dailyLogs = pgTable(
  "daily_logs",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .references(() => users.id, { onDelete: "cascade" })
      .notNull(),
    date: date("date").notNull(),
    mood: varchar("mood", { length: 20 }), // 'happy', 'content', 'neutral', 'sad', 'angry', 'anxious'
    painLevel: integer("pain_level"), // 0-10 scale
    energyLevel: integer("energy_level"), // 0-10 scale
    waterIntake: integer("water_intake"), // glasses of water
    sleepHours: decimal("sleep_hours", { precision: 3, scale: 1 }),
    exerciseMinutes: integer("exercise_minutes"),
    weight: decimal("weight", { precision: 5, scale: 2 }),
    notes: text("notes"),
    isOnPeriod: boolean("is_on_period").default(false),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    userDateIdx: index("daily_logs_user_date_idx").on(table.userId, table.date),
    dateIdx: index("daily_logs_date_idx").on(table.date),
    userDateUniqueIdx: index("daily_logs_user_date_unique").on(
      table.userId,
      table.date
    ),
  })
);

export const symptoms = pgTable("symptoms", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: varchar("name", { length: 100 }).notNull().unique(),
  category: varchar("category", { length: 50 }), // 'physical', 'emotional', 'cognitive'
  isDefault: boolean("is_default").default(false), // pre-defined symptoms
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const dailyLogSymptoms = pgTable(
  "daily_log_symptoms",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    dailyLogId: uuid("daily_log_id")
      .references(() => dailyLogs.id, { onDelete: "cascade" })
      .notNull(),
    symptomId: uuid("symptom_id")
      .references(() => symptoms.id, { onDelete: "cascade" })
      .notNull(),
    severity: integer("severity"), // 1-5 scale, optional
    notes: text("notes"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => ({
    dailyLogSymptomIdx: index("daily_log_symptoms_daily_log_symptom_idx").on(
      table.dailyLogId,
      table.symptomId
    ),
  })
);

// ==================== PREDICTIONS & ANALYTICS ====================

export const cyclePredictions = pgTable(
  "cycle_predictions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .references(() => users.id, { onDelete: "cascade" })
      .notNull(),
    predictedPeriodStart: date("predicted_period_start").notNull(),
    predictedPeriodEnd: date("predicted_period_end"),
    predictedOvulation: date("predicted_ovulation"),
    fertilityWindowStart: date("fertility_window_start"),
    fertilityWindowEnd: date("fertility_window_end"),
    confidence: decimal("confidence", { precision: 5, scale: 2 }), // percentage 0-100
    algorithmVersion: varchar("algorithm_version", { length: 20 }).default(
      "v1.0"
    ),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => ({
    userIdIdx: index("cycle_predictions_user_id_idx").on(table.userId),
    periodStartIdx: index("cycle_predictions_period_start_idx").on(
      table.predictedPeriodStart
    ),
  })
);

// ==================== GAMIFICATION ====================

export const badges = pgTable("badges", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: varchar("name", { length: 100 }).notNull().unique(),
  description: text("description"),
  icon: varchar("icon", { length: 50 }), // emoji or icon name
  category: varchar("category", { length: 50 }), // 'streak', 'logging', 'health', 'milestone'
  requirement: jsonb("requirement"), // flexible requirement structure
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const userBadges = pgTable(
  "user_badges",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .references(() => users.id, { onDelete: "cascade" })
      .notNull(),
    badgeId: uuid("badge_id")
      .references(() => badges.id, { onDelete: "cascade" })
      .notNull(),
    earnedAt: timestamp("earned_at").defaultNow().notNull(),
    progress: jsonb("progress"), // for tracking progress towards badge
  },
  (table) => ({
    userBadgeIdx: index("user_badges_user_badge_idx").on(
      table.userId,
      table.badgeId
    ),
    earnedAtIdx: index("user_badges_earned_at_idx").on(table.earnedAt),
  })
);

export const streaks = pgTable(
  "streaks",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .references(() => users.id, { onDelete: "cascade" })
      .notNull(),
    type: varchar("type", { length: 50 }).notNull(), // 'logging', 'exercise', 'water'
    currentStreak: integer("current_streak").default(0),
    longestStreak: integer("longest_streak").default(0),
    lastActivityDate: date("last_activity_date"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    userTypeIdx: index("streaks_user_type_idx").on(table.userId, table.type),
  })
);

export const challenges = pgTable("challenges", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  description: text("description"),
  type: varchar("type", { length: 50 }).notNull(), // 'daily', 'weekly', 'monthly'
  target: integer("target").notNull(),
  targetType: varchar("target_type", { length: 50 }).notNull(), // 'days_logged', 'water_glasses', 'exercise_minutes'
  startDate: date("start_date").notNull(),
  endDate: date("end_date").notNull(),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const userChallenges = pgTable(
  "user_challenges",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .references(() => users.id, { onDelete: "cascade" })
      .notNull(),
    challengeId: uuid("challenge_id")
      .references(() => challenges.id, { onDelete: "cascade" })
      .notNull(),
    currentProgress: integer("current_progress").default(0),
    isCompleted: boolean("is_completed").default(false),
    completedAt: timestamp("completed_at"),
    joinedAt: timestamp("joined_at").defaultNow().notNull(),
  },
  (table) => ({
    userChallengeIdx: index("user_challenges_user_challenge_idx").on(
      table.userId,
      table.challengeId
    ),
  })
);

// ==================== REMINDERS & NOTIFICATIONS ====================

export const reminderSettings = pgTable(
  "reminder_settings",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .references(() => users.id, { onDelete: "cascade" })
      .notNull(),
    type: varchar("type", { length: 50 }).notNull(), // 'period', 'pill', 'log', 'water'
    isEnabled: boolean("is_enabled").default(true),
    time: varchar("time", { length: 8 }), // HH:MM:SS format
    frequency: varchar("frequency", { length: 50 }), // 'daily', 'weekly', 'custom'
    customInterval: integer("custom_interval"), // for custom frequencies (in hours)
    message: text("message"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    userTypeIdx: index("reminder_settings_user_type_idx").on(
      table.userId,
      table.type
    ),
  })
);

export const notifications = pgTable(
  "notifications",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .references(() => users.id, { onDelete: "cascade" })
      .notNull(),
    type: varchar("type", { length: 50 }).notNull(),
    title: varchar("title", { length: 200 }).notNull(),
    message: text("message"),
    isRead: boolean("is_read").default(false),
    scheduledFor: timestamp("scheduled_for"),
    sentAt: timestamp("sent_at"),
    metadata: jsonb("metadata"), // additional data for specific notification types
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => ({
    userIdIdx: index("notifications_user_id_idx").on(table.userId),
    scheduledIdx: index("notifications_scheduled_idx").on(table.scheduledFor),
    isReadIdx: index("notifications_is_read_idx").on(table.isRead),
  })
);

// ==================== INSIGHTS & ANALYTICS ====================

export const userInsights = pgTable(
  "user_insights",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .references(() => users.id, { onDelete: "cascade" })
      .notNull(),
    month: integer("month").notNull(), // 1-12
    year: integer("year").notNull(),
    totalDaysLogged: integer("total_days_logged").default(0),
    averageMoodScore: decimal("average_mood_score", { precision: 3, scale: 2 }),
    averagePainLevel: decimal("average_pain_level", { precision: 3, scale: 2 }),
    averageEnergyLevel: decimal("average_energy_level", {
      precision: 3,
      scale: 2,
    }),
    averageWaterIntake: decimal("average_water_intake", {
      precision: 5,
      scale: 2,
    }),
    mostCommonSymptoms: jsonb("most_common_symptoms"), // array of symptom IDs with frequencies
    moodDistribution: jsonb("mood_distribution"), // object with mood frequencies
    periodDaysCount: integer("period_days_count").default(0),
    cycleConsistency: decimal("cycle_consistency", { precision: 5, scale: 2 }), // percentage
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    userMonthYearIdx: index("user_insights_user_month_year_idx").on(
      table.userId,
      table.month,
      table.year
    ),
  })
);

// ==================== AFFIRMATIONS ====================

export const affirmations = pgTable("affirmations", {
  id: uuid("id").defaultRandom().primaryKey(),
  message: text("message").notNull(),
  category: varchar("category", { length: 50 }), // 'motivation', 'self-care', 'body-positive'
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const userAffirmations = pgTable(
  "user_affirmations",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .references(() => users.id, { onDelete: "cascade" })
      .notNull(),
    affirmationId: uuid("affirmation_id")
      .references(() => affirmations.id, { onDelete: "cascade" })
      .notNull(),
    shownAt: timestamp("shown_at").defaultNow().notNull(),
    liked: boolean("liked"),
  },
  (table) => ({
    userAffirmationIdx: index("user_affirmations_user_affirmation_idx").on(
      table.userId,
      table.affirmationId
    ),
    shownAtIdx: index("user_affirmations_shown_at_idx").on(table.shownAt),
  })
);

// ==================== APP SETTINGS ====================

export const userSettings = pgTable(
  "user_settings",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .references(() => users.id, { onDelete: "cascade" })
      .notNull(),
    key: varchar("key", { length: 100 }).notNull(),
    value: jsonb("value"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    userIdIdx: index("user_settings_user_id_idx").on(table.userId),
    userKeyIdx: index("user_settings_user_key_idx").on(table.userId, table.key),
  })
);

// ==================== TODOS ====================

export const todos = pgTable(
  "todos",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .references(() => users.id, { onDelete: "cascade" })
      .notNull(),
    title: varchar("title", { length: 255 }).notNull(),
    description: text("description"),
    isCompleted: boolean("is_completed").default(false),
    isDefault: boolean("is_default").default(false), // for pre-populated todos
    category: varchar("category", { length: 50 }), // 'period', 'health', 'personal', etc.
    priority: varchar("priority", { length: 20 }).default("medium"), // 'low', 'medium', 'high'
    dueDate: timestamp("due_date"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    userIdIdx: index("todos_user_id_idx").on(table.userId),
    completedIdx: index("todos_completed_idx").on(table.isCompleted),
    categoryIdx: index("todos_category_idx").on(table.category),
  })
);

// ==================== RELATIONS ====================

export const usersRelations = relations(users, ({ one, many }) => ({
  profile: one(userProfiles, {
    fields: [users.id],
    references: [userProfiles.userId],
  }),
  cycles: many(cycles),
  dailyLogs: many(dailyLogs),
  periodDays: many(periodDays),
  userBadges: many(userBadges),
  streaks: many(streaks),
  userChallenges: many(userChallenges),
  reminderSettings: many(reminderSettings),
  notifications: many(notifications),
  insights: many(userInsights),
  affirmations: many(userAffirmations),
  settings: one(userSettings, {
    fields: [users.id],
    references: [userSettings.userId],
  }),
}));

export const userProfilesRelations = relations(userProfiles, ({ one }) => ({
  user: one(users, {
    fields: [userProfiles.userId],
    references: [users.id],
  }),
}));

export const cyclesRelations = relations(cycles, ({ one, many }) => ({
  user: one(users, {
    fields: [cycles.userId],
    references: [users.id],
  }),
  periodDays: many(periodDays),
}));

export const dailyLogsRelations = relations(dailyLogs, ({ one, many }) => ({
  user: one(users, {
    fields: [dailyLogs.userId],
    references: [users.id],
  }),
  symptoms: many(dailyLogSymptoms),
}));

export const symptomsRelations = relations(symptoms, ({ many }) => ({
  dailyLogSymptoms: many(dailyLogSymptoms),
}));

export const dailyLogSymptomsRelations = relations(
  dailyLogSymptoms,
  ({ one }) => ({
    dailyLog: one(dailyLogs, {
      fields: [dailyLogSymptoms.dailyLogId],
      references: [dailyLogs.id],
    }),
    symptom: one(symptoms, {
      fields: [dailyLogSymptoms.symptomId],
      references: [symptoms.id],
    }),
  })
);

export const badgesRelations = relations(badges, ({ many }) => ({
  userBadges: many(userBadges),
}));

export const userBadgesRelations = relations(userBadges, ({ one }) => ({
  user: one(users, {
    fields: [userBadges.userId],
    references: [users.id],
  }),
  badge: one(badges, {
    fields: [userBadges.badgeId],
    references: [badges.id],
  }),
}));

export const challengesRelations = relations(challenges, ({ many }) => ({
  userChallenges: many(userChallenges),
}));

export const userChallengesRelations = relations(userChallenges, ({ one }) => ({
  user: one(users, {
    fields: [userChallenges.userId],
    references: [users.id],
  }),
  challenge: one(challenges, {
    fields: [userChallenges.challengeId],
    references: [challenges.id],
  }),
}));

export const affirmationsRelations = relations(affirmations, ({ many }) => ({
  userAffirmations: many(userAffirmations),
}));

export const userAffirmationsRelations = relations(
  userAffirmations,
  ({ one }) => ({
    user: one(users, {
      fields: [userAffirmations.userId],
      references: [users.id],
    }),
    affirmation: one(affirmations, {
      fields: [userAffirmations.affirmationId],
      references: [affirmations.id],
    }),
  })
);

// ==================== TYPE EXPORTS ====================

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type UserProfile = typeof userProfiles.$inferSelect;
export type NewUserProfile = typeof userProfiles.$inferInsert;
export type Cycle = typeof cycles.$inferSelect;
export type NewCycle = typeof cycles.$inferInsert;
export type DailyLog = typeof dailyLogs.$inferSelect;
export type NewDailyLog = typeof dailyLogs.$inferInsert;
export type Symptom = typeof symptoms.$inferSelect;
export type NewSymptom = typeof symptoms.$inferInsert;
export type Badge = typeof badges.$inferSelect;
export type NewBadge = typeof badges.$inferInsert;
export type UserBadge = typeof userBadges.$inferSelect;
export type NewUserBadge = typeof userBadges.$inferInsert;
export type Streak = typeof streaks.$inferSelect;
export type NewStreak = typeof streaks.$inferInsert;
export type Challenge = typeof challenges.$inferSelect;
export type NewChallenge = typeof challenges.$inferInsert;
export type UserChallenge = typeof userChallenges.$inferSelect;
export type NewUserChallenge = typeof userChallenges.$inferInsert;
export type ReminderSetting = typeof reminderSettings.$inferSelect;
export type NewReminderSetting = typeof reminderSettings.$inferInsert;
export type Notification = typeof notifications.$inferSelect;
export type NewNotification = typeof notifications.$inferInsert;
export type UserInsight = typeof userInsights.$inferSelect;
export type NewUserInsight = typeof userInsights.$inferInsert;
export type Affirmation = typeof affirmations.$inferSelect;
export type NewAffirmation = typeof affirmations.$inferInsert;
export type UserSetting = typeof userSettings.$inferSelect;
export type NewUserSetting = typeof userSettings.$inferInsert;
export type Todo = typeof todos.$inferSelect;
export type NewTodo = typeof todos.$inferInsert;
