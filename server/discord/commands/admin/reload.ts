
import { CommandInteraction, Message } from "discord.js";
import { DiscordCommand } from "@shared/schema";
import { storage } from "../../../storage";

export default {
  name: "reload",
  description: "Reload a command",
  category: "admin",
  aliases: ["refresh"],
  slash: false,
  prefix: true,
  cooldown: 3,
  permissions: ["Administrator"],
  async execute(interaction: CommandInteraction | Message, args?: string[]) {
    if (!(interaction instanceof Message)) {
      return interaction.reply("This command can only be used with prefix");
    }

    if (!args || args.length < 1) {
      return interaction.reply("Usage: !reload <command>");
    }

    const commandName = args[0].toLowerCase();

    try {
      const command = await storage.getCommand(commandName);
      if (!command) {
        return interaction.reply("❌ Command not found");
      }

      // Delete command from cache
      delete require.cache[require.resolve(`../${command.category}/${commandName}.ts`)];
      
      // Re-require the command
      const newCommand = require(`../${command.category}/${commandName}.ts`).default;
      
      // Update command in storage
      await storage.updateCommand(commandName, {
        ...command,
        ...newCommand
      });

      return interaction.reply(`✅ Command \`${commandName}\` has been reloaded`);
    } catch (error) {
      console.error("[RELOAD ERROR]", error);
      return interaction.reply("❌ Failed to reload command");
    }
  }
} as DiscordCommand;
