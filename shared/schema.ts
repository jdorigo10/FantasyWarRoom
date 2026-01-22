import { sql } from "drizzle-orm";
import { pgTable, text, varchar, jsonb, timestamp, integer, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Draft Sessions Table
export const draftSessions = pgTable("draft_sessions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id"), // Optional user association
  sessionName: text("session_name").notNull(),
  settings: jsonb("settings").notNull(), // Draft settings (teamCount, scoring, etc.)
  picks: jsonb("picks").notNull().default(sql`'[]'::jsonb`), // Array of picks
  currentPickIndex: integer("current_pick_index").notNull().default(0),
  playerTags: jsonb("player_tags").notNull().default(sql`'{}'::jsonb`), // Player favorite/target tags
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertDraftSessionSchema = createInsertSchema(draftSessions).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const updateDraftSessionSchema = insertDraftSessionSchema.partial();

export type InsertDraftSession = z.infer<typeof insertDraftSessionSchema>;
export type UpdateDraftSession = z.infer<typeof updateDraftSessionSchema>;
export type DraftSession = typeof draftSessions.$inferSelect;

// User Preferences Table (for persistent settings)
export const userPreferences = pgTable("user_preferences", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").unique(), // Optional user association
  theme: text("theme").notNull().default('dark'),
  accentColor: text("accent_color").notNull().default('#2ea043'),
  defaultTeamCount: integer("default_team_count").notNull().default(12),
  defaultScoring: text("default_scoring").notNull().default('PPR'),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertUserPreferencesSchema = createInsertSchema(userPreferences).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const updateUserPreferencesSchema = insertUserPreferencesSchema.partial();

export type InsertUserPreferences = z.infer<typeof insertUserPreferencesSchema>;
export type UpdateUserPreferences = z.infer<typeof updateUserPreferencesSchema>;
export type UserPreferences = typeof userPreferences.$inferSelect;
