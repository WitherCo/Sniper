import express, { type Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import path from "path";
import { initializeBot } from "./discord/index.js";
import { deployCommands } from "./discord/deploy-commands.js";
import { Command, Category, ServerStats, BotConfig } from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  // Initialize Discord bot
  const bot = await initializeBot();

  // Prefix-only mode, skip slash command deployment
  console.log("[DEBUG] Running in prefix-only mode, skipping slash command deployment.");

  // API Routes - all prefixed with /api

  // Get bot status
  app.get("/api/status", async (req, res) => {
    try {
      const isConnected = bot.isReady();
      res.json({ 
        status: isConnected ? "online" : "offline",
        username: isConnected ? bot.user?.username : null,
        guilds: isConnected ? bot.guilds.cache.size : 0
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to get bot status" });
    }
  });

  // Get all commands
  app.get("/api/commands", async (req, res) => {
    try {
      const commands = await storage.getAllCommands();
      res.json(commands);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch commands" });
    }
  });

  // Get commands by category
  app.get("/api/commands/category/:category", async (req, res) => {
    try {
      const { category } = req.params;
      const commands = await storage.getCommandsByCategory(category);
      res.json(commands);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch commands by category" });
    }
  });

  // Get command by name
  app.get("/api/commands/:name", async (req, res) => {
    try {
      const { name } = req.params;
      const command = await storage.getCommandByName(name);
      if (!command) {
        return res.status(404).json({ message: "Command not found" });
      }
      res.json(command);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch command" });
    }
  });

  // Get all categories
  app.get("/api/categories", async (req, res) => {
    try {
      const categories = await storage.getAllCategories();
      res.json(categories);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch categories" });
    }
  });

  // Get server stats
  app.get("/api/stats", async (req, res) => {
    try {
      const stats = await storage.getServerStats();
      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch server stats" });
    }
  });

  // Get bot configuration
  app.get("/api/config", async (req, res) => {
    try {
      const config = await storage.getBotConfig();
      res.json(config);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch bot configuration" });
    }
  });

  // Update bot configuration
  app.post("/api/config", express.json(), async (req, res) => {
    try {
      const config = req.body;
      const updated = await storage.updateBotConfig(config);
      res.json(updated);
    } catch (error) {
      res.status(500).json({ message: "Failed to update bot configuration" });
    }
  });

  // API endpoint for slash commands (disabled in prefix-only mode)
  app.post("/api/deploy-commands", async (req, res) => {
    res.json({ 
      success: false, 
      message: "Bot is running in prefix-only mode. Slash commands are disabled.",
      prefixMode: true
    });
  });

  const httpServer = createServer(app);

  return httpServer;
}