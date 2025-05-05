import { CommandInteraction, Message, EmbedBuilder } from "discord.js";
import { DiscordCommand } from "@shared/schema";

export default {
  name: "timestamp",
  description: "Generate a Discord timestamp",
  category: "utility",
  aliases: ["time"],
  slash: false,
  prefix: true,
  cooldown: 3,
  permissions: [],
  async execute(interaction: CommandInteraction | Message, args?: string[]) {
    if (!(interaction instanceof Message)) {
      return interaction.reply("This command can only be used with prefix");
    }

    if (!args || args.length === 0) {
      const now = Math.floor(Date.now() / 1000);
      const embed = new EmbedBuilder()
        .setTitle("Discord Timestamp Formats")
        .setColor(0x3498db)
        .setDescription("Here are the current timestamps in different formats:")
        .addFields([
          { name: "Short Time", value: `\`<t:${now}:t>\` → <t:${now}:t>`, inline: true },
          { name: "Long Time", value: `\`<t:${now}:T>\` → <t:${now}:T>`, inline: true },
          { name: "Short Date", value: `\`<t:${now}:d>\` → <t:${now}:d>`, inline: true },
          { name: "Long Date", value: `\`<t:${now}:D>\` → <t:${now}:D>`, inline: true },
          { name: "Short Date/Time", value: `\`<t:${now}:f>\` → <t:${now}:f>`, inline: true },
          { name: "Long Date/Time", value: `\`<t:${now}:F>\` → <t:${now}:F>`, inline: true },
          { name: "Relative Time", value: `\`<t:${now}:R>\` → <t:${now}:R>`, inline: true }
        ])
        .setFooter({ text: "Usage: !timestamp <unix_timestamp> [format]" });

      return interaction.reply({ embeds: [embed] });
    }

    const timestamp = parseInt(args[0]);
    const format = args[1] || "f";

    if (isNaN(timestamp)) {
      return interaction.reply("❌ Please provide a valid Unix timestamp");
    }

    if (!["t", "T", "d", "D", "f", "F", "R"].includes(format)) {
      return interaction.reply("❌ Invalid format. Use t, T, d, D, f, F, or R");
    }

    return interaction.reply(`\`<t:${timestamp}:${format}>\` → <t:${timestamp}:${format}>`);
  }
} as DiscordCommand;
