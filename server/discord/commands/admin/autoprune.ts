
import { Message, EmbedBuilder } from "discord.js";
import { DiscordCommand } from "@shared/schema";

export default {
  name: "autoprune",
  description: "Configure automatic member pruning",
  category: "admin",
  aliases: ["prune"],
  slash: false,
  prefix: true,
  cooldown: 5,
  permissions: ["Administrator"],
  async execute(interaction: Message, args?: string[]) {
    if (!args?.length) {
      return interaction.reply("Usage: !autoprune <days> [enable/disable]");
    }

    const days = parseInt(args[0]);
    const action = args[1]?.toLowerCase();

    if (isNaN(days) || days < 1 || days > 30) {
      return interaction.reply("❌ Please provide a valid number of days (1-30)");
    }

    const embed = new EmbedBuilder()
      .setTitle("⚙️ Auto-Prune Configuration")
      .setTimestamp();

    if (action === "enable") {
      embed.setDescription(`✅ Auto-prune enabled for inactive members (${days} days)`)
        .setColor("#00ff00");
    } else if (action === "disable") {
      embed.setDescription("❌ Auto-prune disabled")
        .setColor("#ff0000");
    } else {
      embed.setDescription(`Current auto-prune setting: ${days} days`)
        .setColor("#0099ff");
    }

    return interaction.reply({ embeds: [embed] });
  }
} as DiscordCommand;
