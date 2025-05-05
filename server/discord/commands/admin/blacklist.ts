import { CommandInteraction, Message, EmbedBuilder } from "discord.js";
import { DiscordCommand } from "@shared/schema";
import { storage } from "../../../storage";

export default {
  name: "blacklist",
  description: "Blacklist users from using the bot",
  category: "admin",
  aliases: ["bl"],
  slash: false,
  prefix: true,
  cooldown: 3,
  permissions: ["Administrator"],
  async execute(interaction: CommandInteraction | Message, args?: string[]) {
    if (!(interaction instanceof Message)) {
      return interaction.reply("This command can only be used with prefix");
    }

    if (!args || args.length < 2) {
      return interaction.reply("Usage: !blacklist <add/remove/list> <userId>");
    }

    const action = args[0].toLowerCase();
    const userId = args[1];

    try {
      const blacklist = await storage.getBlacklist() || [];

      switch (action) {
        case "add":
          if (blacklist.includes(userId)) {
            return interaction.reply("❌ User is already blacklisted");
          }
          await storage.addToBlacklist(userId);
          return interaction.reply(`✅ Added ${userId} to blacklist`);

        case "remove":
          if (!blacklist.includes(userId)) {
            return interaction.reply("❌ User is not blacklisted");
          }
          await storage.removeFromBlacklist(userId);
          return interaction.reply(`✅ Removed ${userId} from blacklist`);

        case "list":
          const embed = new EmbedBuilder()
            .setTitle("📋 Blacklisted Users")
            .setDescription(blacklist.length > 0 ? blacklist.join("\n") : "No blacklisted users")
            .setColor(0xff0000)
            .setTimestamp();
          return interaction.reply({ embeds: [embed] });

        default:
          return interaction.reply("❌ Invalid action. Use add, remove, or list");
      }
    } catch (error) {
      console.error("[BLACKLIST ERROR]", error);
      return interaction.reply("❌ Failed to manage blacklist");
    }
  }
} as DiscordCommand;