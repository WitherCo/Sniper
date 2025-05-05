import { 
  users, type User, type InsertUser,
  type Command, type InsertCommand, 
  type Category, type InsertCategory,
  type BotConfig, type InsertBotConfig,
  type ServerStats, type InsertServerStats
} from "@shared/schema";

interface ServerBan {
  serverId: string;
  reason: string;
  bannedBy: string;
  bannedAt: Date;
}

interface BotBan {
  userId: string;
  reason: string;
  bannedBy: string;
  bannedAt: Date;
}

// modify the interface with any CRUD methods
// you might need

export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // Command methods
  getCommand(id: number): Promise<Command | undefined>;
  getCommandByName(name: string): Promise<Command | undefined>;
  getCommandsByCategory(category: string): Promise<Command[]>;
  getAllCommands(): Promise<Command[]>;
  createCommand(command: InsertCommand): Promise<Command>;
  updateCommand(command: Command): Promise<Command>;
  deleteCommand(id: number): Promise<boolean>;

  // Category methods
  getCategory(id: number): Promise<Category | undefined>;
  getCategoryByName(name: string): Promise<Category | undefined>;

  // Server ban methods
  getServerBans(): Promise<ServerBan[]>;
  createServerBan(ban: ServerBan): Promise<ServerBan>;
  removeServerBan(serverId: string): Promise<boolean>;
  getServerBan(serverId: string): Promise<ServerBan | undefined>;


  // Bot ban methods
  createBotBan(ban: BotBan): Promise<BotBan>;
  removeBotBan(userId: string): Promise<boolean>;
  getBotBan(userId: string): Promise<BotBan | undefined>;


  getAllCategories(): Promise<Category[]>;
  createCategory(category: InsertCategory): Promise<Category>;
  updateCategory(category: Category): Promise<Category>;
  deleteCategory(id: number): Promise<boolean>;

  // Bot config methods
  getBotConfig(): Promise<BotConfig | undefined>;
  updateBotConfig(config: BotConfig): Promise<BotConfig>;

  // Server stats methods
  getServerStats(): Promise<ServerStats | undefined>;
  updateServerStats(stats: InsertServerStats): Promise<ServerStats>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private commands: Map<number, Command>;
  private categories: Map<number, Category>;
  private botBans: Map<string, BotBan>;
  private serverBans: Map<string, ServerBan>;
  private botConfig?: BotConfig;
  private serverStats?: ServerStats;
  private userId: number;
  private commandId: number;
  private categoryId: number;

  constructor() {
    this.users = new Map();
    this.commands = new Map();
    this.categories = new Map();
    this.botBans = new Map();
    this.serverBans = new Map();
    this.userId = 1;
    this.commandId = 1;
    this.categoryId = 1;
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userId++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  // Command methods
  async getCommand(id: number): Promise<Command | undefined> {
    return this.commands.get(id);
  }

  async getCommandByName(name: string): Promise<Command | undefined> {
    return Array.from(this.commands.values()).find(
      (cmd) => cmd.name === name
    );
  }

  async getCommandsByCategory(category: string): Promise<Command[]> {
    return Array.from(this.commands.values()).filter(
      (cmd) => cmd.category === category
    );
  }

  async getAllCommands(): Promise<Command[]> {
    return Array.from(this.commands.values());
  }

  async createCommand(command: InsertCommand): Promise<Command> {
    const id = this.commandId++;
    const newCommand: Command = { ...command, id };
    this.commands.set(id, newCommand);
    return newCommand;
  }

  async updateCommand(command: Command): Promise<Command> {
    this.commands.set(command.id!, command);
    return command;
  }

  async deleteCommand(id: number): Promise<boolean> {
    return this.commands.delete(id);
  }

  // Category methods
  async getCategory(id: number): Promise<Category | undefined> {
    return this.categories.get(id);
  }

  async getCategoryByName(name: string): Promise<Category | undefined> {
    return Array.from(this.categories.values()).find(
      (cat) => cat.name === name
    );
  }

  async getAllCategories(): Promise<Category[]> {
    return Array.from(this.categories.values());
  }

  async createCategory(category: InsertCategory): Promise<Category> {
    const id = this.categoryId++;
    const newCategory: Category = { ...category, id };
    this.categories.set(id, newCategory);
    return newCategory;
  }

  async updateCategory(category: Category): Promise<Category> {
    this.categories.set(category.id!, category);
    return category;
  }

  async deleteCategory(id: number): Promise<boolean> {
    return this.categories.delete(id);
  }

  // Bot config methods
  async getBotConfig(): Promise<BotConfig | undefined> {
    return this.botConfig;
  }

  async updateBotConfig(config: BotConfig): Promise<BotConfig> {
    this.botConfig = config;
    return config;
  }

  // Server stats methods
  async getServerStats(): Promise<ServerStats | undefined> {
    return this.serverStats;
  }

  async updateServerStats(stats: InsertServerStats): Promise<ServerStats> {
    if (this.serverStats) {
      this.serverStats = { ...this.serverStats, ...stats };
    } else {
      this.serverStats = { id: 1, ...stats };
    }
    return this.serverStats;
  }

  // Server ban methods
  async getServerBans(): Promise<ServerBan[]> {
    return Array.from(this.serverBans.values());
  }

  async createServerBan(ban: ServerBan): Promise<ServerBan> {
    this.serverBans.set(ban.serverId, ban);
    return ban;
  }

  async removeServerBan(serverId: string): Promise<boolean> {
    return this.serverBans.delete(serverId);
  }

  async getServerBan(serverId: string): Promise<ServerBan | undefined> {
    return this.serverBans.get(serverId);
  }

  // Bot ban methods
  async createBotBan(ban: BotBan): Promise<BotBan> {
    this.botBans.set(ban.userId, ban);
    return ban;
  }

  async removeBotBan(userId: string): Promise<boolean> {
    return this.botBans.delete(userId);
  }

  async getBotBan(userId: string): Promise<BotBan | undefined> {
    return this.botBans.get(userId);
  }

  // Blacklist methods
  private blacklist: Set<string> = new Set();

  async addToBlacklist(userId: string): Promise<void> {
    this.blacklist.add(userId);
  }

  async removeFromBlacklist(userId: string): Promise<boolean> {
    return this.blacklist.delete(userId);
  }

  async getBlacklist(): Promise<string[]> {
    return Array.from(this.blacklist);
  }
}

export const storage = new MemStorage();