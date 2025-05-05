import { pgTable, text, serial, integer, boolean, json, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const commands = pgTable("commands", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  category: text("category").notNull(),
  usage: text("usage").notNull(),
  example: text("example"),
  slash: boolean("slash").default(false),
  prefix: boolean("prefix").default(true),
  cooldown: integer("cooldown").default(3),
  permissions: text("permissions").array(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const categories = pgTable("categories", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  description: text("description"),
  commandCount: integer("command_count").default(0),
});

export const botConfig = pgTable("bot_config", {
  id: serial("id").primaryKey(),
  prefix: text("prefix").default("!"),
  ownerId: text("owner_id").notNull(),
  presence: text("presence").default("online"),
  status: text("status").default("Helping servers"),
});

export const serverStats = pgTable("server_stats", {
  id: serial("id").primaryKey(),
  totalCommands: integer("total_commands").default(0),
  slashCommands: integer("slash_commands").default(0),
  prefixCommands: integer("prefix_commands").default(0),
  activeServers: integer("active_servers").default(0),
});

// Define Insert schemas
export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export const insertCommandSchema = createInsertSchema(commands).omit({
  id: true,
  createdAt: true,
});

export const insertCategorySchema = createInsertSchema(categories).omit({
  id: true,
});

export const insertBotConfigSchema = createInsertSchema(botConfig).omit({
  id: true,
});

export const insertServerStatsSchema = createInsertSchema(serverStats).omit({
  id: true,
});

// Define types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertCommand = z.infer<typeof insertCommandSchema>;
export type Command = typeof commands.$inferSelect;

export type InsertCategory = z.infer<typeof insertCategorySchema>;
export type Category = typeof categories.$inferSelect;

export type InsertBotConfig = z.infer<typeof insertBotConfigSchema>;
export type BotConfig = typeof botConfig.$inferSelect;

export type InsertServerStats = z.infer<typeof insertServerStatsSchema>;
export type ServerStats = typeof serverStats.$inferSelect;

// Discord command type (not stored in database)
export type DiscordCommand = {
  name: string;
  description: string;
  category: string;
  aliases?: string[];
  slash?: boolean;
  prefix?: boolean;
  cooldown?: number;
  permissions?: string[];
  options?: CommandOption[];
  execute: Function;
};

export type CommandOption = {
  name: string;
  description: string;
  type: string;
  required?: boolean;
  choices?: { name: string; value: string }[];
};

export interface BotBan {
  userId: string;
  reason: string;
  bannedBy: string;
  bannedAt: Date;
}

export interface IStorage {
  // Bot ban methods
  createBotBan(ban: BotBan): Promise<BotBan>;
  removeBotBan(userId: string): Promise<boolean>;
  getBotBan(userId: string): Promise<BotBan | undefined>;

  // User methods 
  getUser(id: number): Promise<User | undefined>;
}