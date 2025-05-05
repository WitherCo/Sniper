
import { CommandInteraction, Message, EmbedBuilder } from "discord.js";
import { DiscordCommand } from "@shared/schema";
import { storage } from "../../../storage";

export default {
  name: "automod",
  description: "Configure auto-moderation settings",
  category: "admin",
  aliases: ["automoderator"],
  slash: false,
  prefix: true,
  cooldown: 3,
  permissions: ["ManageGuild"],
  async execute(interaction: CommandInteraction | Message, args?: string[]) {
    if (!(interaction instanceof Message)) {
      return interaction.reply("This command can only be used with prefix");
    }

    if (!interaction.guild) {
      return interaction.reply("❌ This command can only be used in a server");
    }

    if (!args || args.length < 1) {
      return interaction.reply("Usage: !automod <filter/links/spam/invites> <on/off>");
    }

    const subcommand = args[0].toLowerCase();
    const setting = args[1]?.toLowerCase();
    const guildId = interaction.guild.id;

    const validSettings = ["filter", "links", "spam", "invites"];
    if (!validSettings.includes(subcommand)) {
      return interaction.reply("❌ Invalid setting. Use filter, links, spam, or invites");
    }

    if (setting && !["on", "off"].includes(setting)) {
      return interaction.reply("❌ Invalid option. Use on or off");
    }

    try {
      const config = await storage.getAutoModConfig(guildId) || {};
      
      if (!setting) {
        // Display current setting
        const status = config[subcommand] ? "enabled" : "disabled";
        return interaction.reply(`🤖 AutoMod ${subcommand} is currently ${status}`);
      }

      // Update setting
      const newConfig = {
        ...config,
        [subcommand]: setting === "on"
      };

      await storage.setAutoModConfig(guildId, newConfig);
      return interaction.reply(`✅ AutoMod ${subcommand} ${setting === "on" ? "enabled" : "disabled"}`);
    } catch (error) {
      return interaction.reply("❌ Failed to update automod settings");
    }
  }
} as DiscordCommand;
