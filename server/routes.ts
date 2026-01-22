import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertDraftSessionSchema, updateDraftSessionSchema, insertUserPreferencesSchema, updateUserPreferencesSchema } from "@shared/schema";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  
  // Draft Sessions API
  app.get("/api/draft-sessions", async (req, res) => {
    try {
      const { userId } = req.query;
      const sessions = await storage.listDraftSessions(userId as string);
      res.json(sessions);
    } catch (error) {
      console.error("Error listing draft sessions:", error);
      res.status(500).json({ error: "Failed to list draft sessions" });
    }
  });

  app.get("/api/draft-sessions/:id", async (req, res) => {
    try {
      const session = await storage.getDraftSession(req.params.id);
      if (!session) {
        return res.status(404).json({ error: "Draft session not found" });
      }
      res.json(session);
    } catch (error) {
      console.error("Error getting draft session:", error);
      res.status(500).json({ error: "Failed to get draft session" });
    }
  });

  app.post("/api/draft-sessions", async (req, res) => {
    try {
      const parsed = insertDraftSessionSchema.parse(req.body);
      const session = await storage.createDraftSession(parsed);
      res.json(session);
    } catch (error) {
      console.error("Error creating draft session:", error);
      res.status(400).json({ error: "Invalid draft session data" });
    }
  });

  app.patch("/api/draft-sessions/:id", async (req, res) => {
    try {
      const parsed = updateDraftSessionSchema.parse(req.body);
      const session = await storage.updateDraftSession(req.params.id, parsed);
      if (!session) {
        return res.status(404).json({ error: "Draft session not found" });
      }
      res.json(session);
    } catch (error) {
      console.error("Error updating draft session:", error);
      res.status(400).json({ error: "Invalid update data" });
    }
  });

  app.delete("/api/draft-sessions/:id", async (req, res) => {
    try {
      await storage.deleteDraftSession(req.params.id);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting draft session:", error);
      res.status(500).json({ error: "Failed to delete draft session" });
    }
  });

  // User Preferences API
  app.get("/api/preferences", async (req, res) => {
    try {
      const { userId } = req.query;
      const prefs = await storage.getUserPreferences(userId as string);
      res.json(prefs || null);
    } catch (error) {
      console.error("Error getting preferences:", error);
      res.status(500).json({ error: "Failed to get preferences" });
    }
  });

  app.post("/api/preferences", async (req, res) => {
    try {
      const parsed = insertUserPreferencesSchema.parse(req.body);
      const prefs = await storage.createUserPreferences(parsed);
      res.json(prefs);
    } catch (error) {
      console.error("Error creating preferences:", error);
      res.status(400).json({ error: "Invalid preferences data" });
    }
  });

  app.patch("/api/preferences/:id", async (req, res) => {
    try {
      const parsed = updateUserPreferencesSchema.parse(req.body);
      const prefs = await storage.updateUserPreferences(req.params.id, parsed);
      if (!prefs) {
        return res.status(404).json({ error: "Preferences not found" });
      }
      res.json(prefs);
    } catch (error) {
      console.error("Error updating preferences:", error);
      res.status(400).json({ error: "Invalid update data" });
    }
  });

  return httpServer;
}
