import { CommandInteraction, Message, EmbedBuilder } from "discord.js";
import { DiscordCommand } from "@shared/schema";
import { storage } from "../../../storage";

export default {
  name: "whitelist",
  description: "Whitelist users to use the bot",
  category: "admin",
  aliases: ["wl"],
  slash: false,
  prefix: true,
  cooldown: 3,
  permissions: ["Administrator"],
  async execute(interaction: CommandInteraction | Message, args?: string[]) {
    if (!(interaction instanceof Message)) {
      return interaction.reply("This command can only be used with prefix");
    }

    if (!args || args.length < 2) {
      return interaction.reply("Usage: !whitelist <add/remove/list> <userId>");
    }

    const action = args[0].toLowerCase();
    const userId = args[1];

    try {
      const whitelist = await storage.getWhitelist() || [];

      switch (action) {
        case "add":
          if (whitelist.includes(userId)) {
            return interaction.reply("❌ User is already whitelisted");
          }
          await storage.addToWhitelist(userId);
          return interaction.reply(`✅ Added ${userId} to whitelist`);

        case "remove":
          if (!whitelist.includes(userId)) {
            return interaction.reply("❌ User is not whitelisted");
          }
          await storage.removeFromWhitelist(userId);
          return interaction.reply(`✅ Removed ${userId} from whitelist`);

        case "list":
          const embed = new EmbedBuilder()
            .setTitle("📋 Whitelisted Users")
            .setDescription(whitelist.length > 0 ? whitelist.join("\n") : "No whitelisted users")
            .setColor(0x00ff00)
            .setTimestamp();
          return interaction.reply({ embeds: [embed] });

        default:
          return interaction.reply("❌ Invalid action. Use add, remove, or list");
      }
    } catch (error) {
      console.error("[WHITELIST ERROR]", error);
      return interaction.reply("❌ Failed to manage whitelist");
    }
  }
} as DiscordCommand;