import type { Express } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  
  // Simple health check route
  app.get(api.health.check.path, async (req, res) => {
    await storage.healthCheck();
    res.json({ status: "ok" });
  });

  return httpServer;
}
