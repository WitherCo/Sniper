import { REST, Routes, RESTPostAPIApplicationCommandsJSONBody } from "discord.js";
import { CommandHandler } from "./handlers/CommandHandler.js";
import { client } from "./index.js";

function validateCommands(commands: any[]): any[] {
  return commands.map(cmd => {
    if (cmd.description && cmd.description.length > 100) {
      cmd.description = cmd.description.substring(0, 97) + '...';
    } else if (!cmd.description || cmd.description.length === 0) {
      cmd.description = "No description provided";
    }

    if (cmd.options && Array.isArray(cmd.options)) {
      cmd.options = cmd.options.map((opt: any) => {
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
}

export async function deployCommands() {
  try {
    const token = process.env.DISCORD_BOT_TOKEN;
    if (!token) {
      throw new Error("DISCORD_BOT_TOKEN is not set in environment variables");
    }

    const clientId = process.env.CLIENT_ID || '1368250543423750349';
    console.log(`Using client ID: ${clientId}`);

    let commands = await CommandHandler.getSlashCommandsJSON();
    console.log(`Preparing to deploy ${commands.length} application (/) commands...`);

    commands = validateCommands(commands);
    const rest = new REST({ version: '10' }).setToken(token);

    try {
      console.log('Deploying commands using PUT method...');
      await rest.put(
        Routes.applicationCommands(clientId),
        { body: commands }
      );
      console.log(`Successfully registered ${commands.length} application commands.`);
    } catch (error: any) {
      if (error.code === 50035) {
        console.log('Received validation error. Attempting to register subset of commands...');
        const reducedCommands = commands.slice(0, 50);

        await rest.put(
          Routes.applicationCommands(clientId),
          { body: reducedCommands }
        );
        console.log(`Successfully registered ${reducedCommands.length} application commands.`);
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

if (process.env.NODE_ENV === undefined) {
  deployCommands()
    .then(() => process.exit(0))
    .catch(error => {
      console.error(error);
      process.exit(1);
    });
}