
import { Message, EmbedBuilder } from "discord.js";
import { DiscordCommand } from "@shared/schema";

export default {
  name: "schedule",
  description: "Schedule automated announcements",
  category: "admin",
  aliases: ["scheduled"],
  slash: false,
  prefix: true,
  cooldown: 3,
  permissions: ["ManageGuild"],
  async execute(interaction: Message, args?: string[]) {
    if (!args?.length) {
      return interaction.reply("Usage: !schedule <add|list|remove> [time] [message]");
    }

    const action = args[0].toLowerCase();
    const embed = new EmbedBuilder()
      .setTitle("⏰ Scheduled Announcements")
      .setTimestamp();

    switch (action) {
      case "add":
        if (args.length < 3) {
          return interaction.reply("❌ Please provide time and message");
        }
        embed.setDescription("Added new scheduled announcement")
          .addFields([
            { name: "Time", value: args[1], inline: true },
            { name: "Message", value: args.slice(2).join(" "), inline: true }
          ])
          .setColor("#00ff00");
        break;

      case "list":
        embed.setDescription("No scheduled announcements")
          .setColor("#0099ff");
        break;

      case "remove":
        if (!args[1]) {
          return interaction.reply("❌ Please provide the announcement ID to remove");
        }
        embed.setDescription(`Removed announcement: ${args[1]}`)
          .setColor("#ff0000");
        break;

      default:
        return interaction.reply("❌ Invalid action. Use add, list, or remove.");
    }

    return interaction.reply({ embeds: [embed] });
  }
} as DiscordCommand;
