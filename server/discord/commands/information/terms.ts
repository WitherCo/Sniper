
import { CommandInteraction, Message, EmbedBuilder } from "discord.js";
import { DiscordCommand } from "@shared/schema";

export default {
  name: "terms",
  description: "View the terms of service",
  category: "information",
  aliases: ["tos"],
  slash: true,
  prefix: true,
  cooldown: 3,
  permissions: [],
  options: [],
  async execute(interaction: CommandInteraction | Message) {
    const embed = new EmbedBuilder()
      .setTitle("Terms of Service")
      .setColor("#5865F2")
      .setDescription("By using this bot, you agree to the following terms:")
      .addFields([
        {
          name: "1. Usage Agreement",
          value: "This bot is provided as-is. Users must not abuse, exploit, or use the bot for malicious purposes."
        },
        {
          name: "2. User Responsibilities",
          value: "Users are responsible for any content they create or share through the bot's commands."
        },
        {
          name: "3. Privacy",
          value: "We collect minimal data necessary for bot functionality. User data is not shared with third parties."
        },
        {
          name: "4. Limitations",
          value: "The bot may have cooldowns and usage limits to prevent abuse and ensure fair usage."
        },
        {
          name: "5. Changes",
          value: "These terms may be updated at any time. Continued use of the bot constitutes acceptance of new terms."
        }
      ])
      .setFooter({ text: "Last Updated: 2024" });

    if (interaction instanceof CommandInteraction) {
      await interaction.reply({ embeds: [embed] });
    } else {
      await interaction.reply({ embeds: [embed] });
    }
  }
} as DiscordCommand;
