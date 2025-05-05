
import { CommandInteraction, Message } from "discord.js";
import { DiscordCommand } from "@shared/schema";
import { storage } from "../../../storage";

export default {
  name: "maintenance",
  description: "Toggle maintenance mode",
  category: "admin",
  aliases: [],
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

    const ownerId = process.env.OWNER_ID;
    if (!ownerId || interaction.author.id !== ownerId) {
      return interaction.reply("❌ Only the bot owner can use this command");
    }

    try {
      const currentMode = await storage.getMaintenanceMode();
      await storage.setMaintenanceMode(!currentMode);

      return interaction.reply(`✅ Maintenance mode has been ${!currentMode ? "enabled" : "disabled"}`);
    } catch (error) {
      return interaction.reply("❌ Failed to toggle maintenance mode");
    }
  }
} as DiscordCommand;
