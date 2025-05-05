import { CommandInteraction, Message, EmbedBuilder } from "discord.js";
import { DiscordCommand } from "@shared/schema";
import { storage } from "../../../storage";

export default {
  name: "commands",
  description: "Enable or disable commands",
  category: "admin",
  aliases: ["cmd"],
  slash: false,
  prefix: true,
  cooldown: 3,
  permissions: ["Administrator"],
  async execute(interaction: CommandInteraction | Message, args?: string[]) {
    if (!(interaction instanceof Message)) {
      return interaction.reply("This command can only be used with prefix");
    }

    if (!interaction.guild) {
      return interaction.reply("❌ This command can only be used in a server");
    }

    if (!args || args.length < 2) {
      return interaction.reply("Usage: !commands <enable/disable> <command>");
    }

    const action = args[0].toLowerCase();
    const commandName = args[1].toLowerCase();
    const guildId = interaction.guild.id;

    if (!["enable", "disable"].includes(action)) {
      return interaction.reply("❌ Invalid action. Use enable or disable");
    }

    try {
      const command = await storage.getCommand(commandName);
      if (!command) {
        return interaction.reply("❌ Command not found");
      }

      const disabled = await storage.getDisabledCommands(guildId) || [];

      if (action === "disable") {
        if (disabled.includes(commandName)) {
          return interaction.reply("❌ Command is already disabled");
        }

        await storage.disableCommand(guildId, commandName);
        return interaction.reply(`✅ Disabled command: ${commandName}`);
      } else {
        if (!disabled.includes(commandName)) {
          return interaction.reply("❌ Command is already enabled");
        }

        await storage.enableCommand(guildId, commandName);
        return interaction.reply(`✅ Enabled command: ${commandName}`);
      }
    } catch (error) {
      return interaction.reply("❌ Failed to modify command status");
    }
  }
} as DiscordCommand;