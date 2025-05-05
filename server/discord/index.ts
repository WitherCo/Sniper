import { Client, IntentsBitField, Collection, REST, Events } from "discord.js";
import { CommandHandler } from "./handlers/CommandHandler";
import { EventHandler } from "./handlers/EventHandler";
import { config } from "./config";
import { storage } from "../storage";
import { serverStats } from "@shared/schema";

// Validate token before proceeding
const token = process.env.DISCORD_BOT_TOKEN;
if (!token) {
  throw new Error("[FATAL] No Discord token provided. Please add DISCORD_BOT_TOKEN to your secrets.");
}

// Validate token exists and format
console.log("[DEBUG] Testing token format...");
console.log("[DEBUG] Token starts with:", token?.slice(0, 1));
console.log("[DEBUG] Token length:", token?.length);
console.log("[DEBUG] Token parts:", token?.split('.').length);

// Discord tokens can start with different prefixes and have varying formats
if (!token || token.split('.').length !== 3) {
  console.log("[DEBUG] Token validation failed");
  throw new Error("[FATAL] Invalid Discord token format. Please check your token in Secrets.");
}
console.log("[DEBUG] Token format is valid");

console.log("[DEBUG] Setting up Discord client with intents");
const client = new Client({
  intents: [
    IntentsBitField.Flags.Guilds,
    IntentsBitField.Flags.GuildMessages,
    IntentsBitField.Flags.GuildMembers,
    IntentsBitField.Flags.MessageContent,
  ],
});

// Add debug event listeners
client.on(Events.Debug, (info) => console.log(`[DISCORD DEBUG] ${info}`));
client.on(Events.Error, (error) => {
  console.error('[DISCORD ERROR]', error);
  // Attempt to reconnect on error
  setTimeout(() => {
    console.log('[DISCORD] Attempting to reconnect...');
    client.destroy();
    client.login(process.env.DISCORD_BOT_TOKEN);
  }, 10000);
});

client.on(Events.Warn, (warning) => console.warn('[DISCORD WARNING]', warning));

// Handle disconnections
client.on(Events.Disconnect, () => {
  console.log('[DISCORD] Bot disconnected, attempting to reconnect...');
  setTimeout(() => {
    client.login(process.env.DISCORD_BOT_TOKEN);
  }, 5000);
});

// Keep the process alive
process.on('unhandledRejection', (error) => {
  console.error('[PROCESS] Unhandled promise rejection:', error);
});

process.on('uncaughtException', (error) => {
  console.error('[PROCESS] Uncaught exception:', error);
});

// Add commands and cooldowns to client
client.commands = new Collection();
client.slashCommands = new Collection(); // Keep but will not use
client.cooldowns = new Collection();

// Running in prefix-only mode
console.log("[DEBUG] Initializing in prefix-only mode (no slash commands)");

// Debug raw message and interaction events
// We'll use these just for logging, but let our event handlers do the actual command processing
client.on('raw', (packet) => {
  // Only log certain types of packets
  if (['MESSAGE_CREATE', 'INTERACTION_CREATE'].includes(packet.t || '')) {
    console.log(`[DEBUG] Raw packet received: ${packet.t}`);
  }
});

export async function initializeBot() {
  try {
    console.log("[DEBUG] Initializing Discord bot");

    // Initialize bot configuration from database
    const botConfig = await storage.getBotConfig();
    if (botConfig) {
      if (botConfig.prefix) {
        config.prefix = botConfig.prefix;
      }
      if (botConfig.ownerId) {
        config.ownerId = botConfig.ownerId;
      }
      console.log(`[DEBUG] Bot config loaded: prefix=${config.prefix}`);
    } else {
      console.log(`[DEBUG] No bot config found in database, using defaults: prefix=${config.prefix}`);
    }

    // Register commands
    await CommandHandler.registerCommands(client);

    // Register events
    console.log("[DEBUG] Registering event handlers");
    await EventHandler.registerEvents(client);

    // Login to Discord
    if (!process.env.DISCORD_BOT_TOKEN) {
      throw new Error("DISCORD_BOT_TOKEN is not set in environment variables");
    }

    console.log("[DEBUG] Logging in to Discord");
    await client.login(process.env.DISCORD_BOT_TOKEN);

    console.log(`[DEBUG] Successfully logged in as ${client.user?.tag}`);
    console.log(`[DEBUG] Bot is in ${client.guilds.cache.size} guilds`);

    if (client.guilds.cache.size > 0) {
      console.log("[DEBUG] Guilds:");
      client.guilds.cache.forEach(guild => {
        console.log(`[DEBUG] - ${guild.name} (${guild.id})`);
      });
    }

    console.log("Discord bot initialized successfully");

    // Update server stats
    if (client.isReady()) {
      const commandCount = client.commands.size;
      // Running in prefix-only mode, all commands are prefix commands
      const prefixCommandCount = commandCount;
      const slashCommandCount = 0;
      const activeServers = client.guilds.cache.size;

      console.log(`[DEBUG] Updating server stats: ${commandCount} total commands, ${prefixCommandCount} prefix commands, ${activeServers} servers`);
      await storage.updateServerStats({
        totalCommands: commandCount,
        slashCommands: slashCommandCount,
        prefixCommands: prefixCommandCount,
        activeServers: activeServers
      });
    }

    return client;
  } catch (error) {
    console.error("Failed to initialize Discord bot:", error);
    throw error;
  }
}

export { client };