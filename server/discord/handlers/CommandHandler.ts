import { Client, Collection, ApplicationCommandType, REST, Routes } from "discord.js";
import path from "path";
import fs from "fs";
import { DiscordCommand } from "@shared/schema";
import { storage } from "../../storage";
import { fileURLToPath } from 'url';

// Get the directory name equivalent to __dirname in CommonJS
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export class CommandHandler {
  private static commandsDir = path.join(__dirname, "../commands");

  /**
   * Register all commands
   */
  static async registerCommands(client: Client): Promise<void> {
    try {
      client.commands = new Collection<string, DiscordCommand>();
      client.slashCommands = new Collection<string, DiscordCommand>();

      console.log(`[DEBUG] Starting command registration`);

      // Get all category folders
      const categories = fs.readdirSync(this.commandsDir);
      console.log(`[DEBUG] Found ${categories.length} command categories`);

      // Iterate through each category
      for (const category of categories) {
        const categoryPath = path.join(this.commandsDir, category);

        // Skip if not a directory
        if (!fs.statSync(categoryPath).isDirectory()) {
          console.log(`[DEBUG] Skipping non-directory: ${category}`);
          continue;
        }

        console.log(`[DEBUG] Processing category: ${category}`);

        // Get all command files in the category
        const commandFiles = fs.readdirSync(categoryPath).filter(file => file.endsWith(".ts") || file.endsWith(".js"));
        console.log(`[DEBUG] Found ${commandFiles.length} command files in category ${category}`);

        // Register category in database if it doesn't exist
        const existingCategory = await storage.getCategoryByName(category);
        if (!existingCategory) {
          console.log(`[DEBUG] Creating new category in database: ${category}`);
          await storage.createCategory({
            name: category,
            description: `${category.charAt(0).toUpperCase() + category.slice(1)} commands`,
            commandCount: commandFiles.length
          });
        } else {
          // Update command count
          console.log(`[DEBUG] Updating existing category in database: ${category}`);
          await storage.updateCategory({
            ...existingCategory,
            commandCount: commandFiles.length
          });
        }

        // Load each command
        for (const file of commandFiles) {
          const filePath = path.join(categoryPath, file);
          console.log(`[DEBUG] Processing command file: ${file}`);

          try {
            // Use dynamic import for ES modules
            const commandModule = await import(filePath);

            if (!commandModule.default) {
              console.warn(`[WARNING] Command file ${file} does not export a default export`);
              continue;
            }

            const command = commandModule.default as DiscordCommand;

            // Set category if not explicitly set
            if (!command.category) {
              command.category = category;
            }

            // Register command in collections
            if (command.name) {
              // Set all commands to prefix only, no slash commands
              command.prefix = true;
              command.slash = false;

              console.log(`[DEBUG] Registering command as prefix-only: ${command.name}`);
              client.commands.set(command.name, command);

              // Register command in database if it doesn't exist
              const existingCommand = await storage.getCommandByName(command.name);
              if (!existingCommand) {
                console.log(`[DEBUG] Creating new command in database: ${command.name}`);
                await storage.createCommand({
                  name: command.name,
                  description: command.description,
                  category: command.category,
                  usage: command.options ? `/${command.name} ${command.options.map(o => o.required ? `<${o.name}>` : `[${o.name}]`).join(" ")}` : `/${command.name}`,
                  example: `/${command.name}`,
                  slash: !!command.slash,
                  prefix: !!command.prefix,
                  cooldown: command.cooldown || 3,
                  permissions: command.permissions || []
                });
              }
            } else {
              console.warn(`[WARNING] Command at ${filePath} is missing a name!`);
            }
          } catch (error) {
            console.error(`[ERROR] Failed to load command at ${filePath}:`, error);
          }
        }
      }

      console.log(`[DEBUG] Command registration complete`);
      console.log(`[DEBUG] Command collection size: ${client.commands.size}`);
      console.log(`[DEBUG] Slash command collection size: ${client.slashCommands.size}`);

      if (client.commands.size > 0) {
        console.log(`[DEBUG] First 10 registered commands:`, Array.from(client.commands.keys()).slice(0, 10));
      }

      if (client.slashCommands.size > 0) {
        console.log(`[DEBUG] First 10 registered slash commands:`, Array.from(client.slashCommands.keys()).slice(0, 10));
      }

      console.log(`Loaded ${client.commands.size} commands (${client.slashCommands.size} slash commands)`);
    } catch (error) {
      console.error("[ERROR] Error registering commands:", error);
      throw error;
    }
  }

  /**
   * Get JSON data for all slash commands for registration
   */
  static async getSlashCommandsJSON(): Promise<any[]> {
    try {
      const commands: any[] = [];

      // Get all category folders
      const categories = fs.readdirSync(this.commandsDir);

      // Iterate through each category
      for (const category of categories) {
        const categoryPath = path.join(this.commandsDir, category);

        // Skip if not a directory
        if (!fs.statSync(categoryPath).isDirectory()) continue;

        // Get all command files in the category
        const commandFiles = fs.readdirSync(categoryPath).filter(file => file.endsWith(".ts") || file.endsWith(".js"));

        // Load each command
        for (const file of commandFiles) {
          const filePath = path.join(categoryPath, file);

          // Use dynamic import for ES modules
          const commandModule = await import(filePath);
          const command = commandModule.default as DiscordCommand;

          // Skip if not a slash command
          if (!command.slash) continue;

          // Create command JSON
          const commandJson: any = {
            name: command.name,
            description: command.description,
            type: ApplicationCommandType.ChatInput,
          };

          // Add options if present
          if (command.options && command.options.length > 0) {
            commandJson.options = command.options.map(option => {
              const optionJson: any = {
                name: option.name,
                description: option.description,
                type: this.getOptionType(option.type),
                required: !!option.required
              };

              // Add choices if present
              if (option.choices) {
                optionJson.choices = option.choices;
              }

              return optionJson;
            });
          }

          commands.push(commandJson);
        }
      }

      return commands;
    } catch (error) {
      console.error("Error generating slash commands JSON:", error);
      throw error;
    }
  }

  /**
   * Convert string option type to numerical Discord API option type
   */
  private static getOptionType(type: string): number {
    const types: Record<string, number> = {
      "STRING": 3,
      "INTEGER": 4,
      "BOOLEAN": 5,
      "USER": 6,
      "CHANNEL": 7,
      "ROLE": 8,
      "MENTIONABLE": 9,
      "NUMBER": 10,
      "ATTACHMENT": 11
    };

    return types[type] || 3; // Default to STRING
  }
}