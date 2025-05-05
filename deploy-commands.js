// Script to manually deploy slash commands
import dotenv from 'dotenv';
import { REST, Routes } from 'discord.js';
import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs';
import { ApplicationCommandType } from 'discord.js';

// Load environment variables
dotenv.config();

// Get the directory name 
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Define path to commands directory
const commandsDir = path.join(__dirname, "server/discord/commands");

console.log("Starting command deployment...");

/**
 * Convert string option type to numerical Discord API option type
 */
function getOptionType(type) {
  const types = {
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

/**
 * Get all slash commands from the commands directory
 */
async function getSlashCommandsJSON() {
  try {
    const commands = [];
    
    // Get all category folders
    const categories = fs.readdirSync(commandsDir);
    
    // Iterate through each category
    for (const category of categories) {
      const categoryPath = path.join(commandsDir, category);
      
      // Skip if not a directory
      if (!fs.statSync(categoryPath).isDirectory()) continue;
      
      // Get all command files in the category
      const commandFiles = fs.readdirSync(categoryPath).filter(file => file.endsWith(".ts") || file.endsWith(".js"));
      
      // Load each command
      for (const file of commandFiles) {
        const filePath = path.join(categoryPath, file);
        
        // Use dynamic import for ES modules
        const commandModule = await import(`file://${filePath}`);
        const command = commandModule.default;
        
        // Skip if not a slash command
        if (!command.slash) continue;
        
        // Create command JSON
        const commandJson = {
          name: command.name,
          description: command.description || "No description provided",
          type: ApplicationCommandType.ChatInput,
        };
        
        // Add options if present
        if (command.options && command.options.length > 0) {
          commandJson.options = command.options.map(option => {
            const optionJson = {
              name: option.name,
              description: option.description || "No description provided",
              type: getOptionType(option.type),
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

async function deployCommands() {
  try {
    if (!process.env.DISCORD_BOT_TOKEN) {
      throw new Error("DISCORD_BOT_TOKEN is not set in environment variables");
    }

    // Use the provided Client ID
    const clientId = '1368250543423750349';
    console.log(`Using client ID: ${clientId}`);

    let commands = await getSlashCommandsJSON();
    
    console.log(`Preparing to deploy ${commands.length} application (/) commands...`);
    
    // Validate all command descriptions
    commands = commands.map(cmd => {
      // Ensure description is 1-100 characters
      if (cmd.description && cmd.description.length > 100) {
        cmd.description = cmd.description.substring(0, 97) + '...';
      } else if (!cmd.description || cmd.description.length === 0) {
        cmd.description = "No description provided";
      }
      
      // Validate option descriptions if any
      if (cmd.options && Array.isArray(cmd.options)) {
        cmd.options = cmd.options.map((opt) => {
          if (opt.description && opt.description.length > 100) {
            opt.description = opt.description.substring(0, 97) + '...';
          } else if (!opt.description || opt.description.length === 0) {
            opt.description = "No description provided";
          }
          return opt;
        });
      }
      
      return cmd;
    });

    const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_BOT_TOKEN);

    // Global command registration - using PUT which replaces all commands at once
    try {
      console.log(`Deploying all commands using PUT method...`);
      await rest.put(
        Routes.applicationCommands(clientId),
        { body: commands }
      );
      console.log(`Successfully registered all ${commands.length} application commands.`);
    } catch (error) {
      if (error.code === 50035) {
        // If we get a validation error, try registering first 50 commands only
        console.log(`Received validation error. Attempting to register a subset of commands...`);
        const reducedCommands = commands.slice(0, 50);
        
        try {
          await rest.put(
            Routes.applicationCommands(clientId),
            { body: reducedCommands }
          );
          console.log(`Successfully registered ${reducedCommands.length} application commands.`);
        } catch (innerError) {
          console.error(`Failed to register even a reduced set of commands:`, innerError);
          throw innerError;
        }
      } else {
        throw error;
      }
    }
    
    return commands;
  } catch (error) {
    console.error("Error deploying slash commands:", error);
    throw error;
  }
}

deployCommands()
  .then((commands) => {
    console.log(`Successfully deployed commands to Discord`);
    process.exit(0);
  })
  .catch((error) => {
    console.error("Error during command deployment:", error);
    process.exit(1);
  });