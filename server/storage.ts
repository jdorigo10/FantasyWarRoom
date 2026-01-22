import { draftSessions, userPreferences, type InsertDraftSession, type UpdateDraftSession, type DraftSession, type InsertUserPreferences, type UpdateUserPreferences, type UserPreferences } from "@shared/schema";
import { db } from "./db";
import { eq } from "drizzle-orm";

export interface IStorage {
  // Draft Sessions
  getDraftSession(id: string): Promise<DraftSession | undefined>;
  createDraftSession(session: InsertDraftSession): Promise<DraftSession>;
  updateDraftSession(id: string, session: UpdateDraftSession): Promise<DraftSession | undefined>;
  deleteDraftSession(id: string): Promise<void>;
  listDraftSessions(userId?: string): Promise<DraftSession[]>;
  
  // User Preferences
  getUserPreferences(userId?: string): Promise<UserPreferences | undefined>;
  createUserPreferences(prefs: InsertUserPreferences): Promise<UserPreferences>;
  updateUserPreferences(id: string, prefs: UpdateUserPreferences): Promise<UserPreferences | undefined>;
}

export class DatabaseStorage implements IStorage {
  // Draft Sessions
  async getDraftSession(id: string): Promise<DraftSession | undefined> {
    const [session] = await db.select().from(draftSessions).where(eq(draftSessions.id, id));
    return session || undefined;
  }

  async createDraftSession(insertSession: InsertDraftSession): Promise<DraftSession> {
    const [session] = await db
      .insert(draftSessions)
      .values({
        ...insertSession,
        updatedAt: new Date(),
      })
      .returning();
    return session;
  }

  async updateDraftSession(id: string, updateSession: UpdateDraftSession): Promise<DraftSession | undefined> {
    const [session] = await db
      .update(draftSessions)
      .set({
        ...updateSession,
        updatedAt: new Date(),
      })
      .where(eq(draftSessions.id, id))
      .returning();
    return session || undefined;
  }

  async deleteDraftSession(id: string): Promise<void> {
    await db.delete(draftSessions).where(eq(draftSessions.id, id));
  }

  async listDraftSessions(userId?: string): Promise<DraftSession[]> {
    if (userId) {
      return await db.select().from(draftSessions).where(eq(draftSessions.userId, userId));
    }
    return await db.select().from(draftSessions);
  }

  // User Preferences
  async getUserPreferences(userId?: string): Promise<UserPreferences | undefined> {
    if (userId) {
      const [prefs] = await db.select().from(userPreferences).where(eq(userPreferences.userId, userId));
      return prefs || undefined;
    }
    // Get default preferences (first one, or undefined)
    const [prefs] = await db.select().from(userPreferences).limit(1);
    return prefs || undefined;
  }

  async createUserPreferences(insertPrefs: InsertUserPreferences): Promise<UserPreferences> {
    const [prefs] = await db
      .insert(userPreferences)
      .values({
        ...insertPrefs,
        updatedAt: new Date(),
      })
      .returning();
    return prefs;
  }

  async updateUserPreferences(id: string, updatePrefs: UpdateUserPreferences): Promise<UserPreferences | undefined> {
    const [prefs] = await db
      .update(userPreferences)
      .set({
        ...updatePrefs,
        updatedAt: new Date(),
      })
      .where(eq(userPreferences.id, id))
      .returning();
    return prefs || undefined;
  }
}

export const storage = new DatabaseStorage();
