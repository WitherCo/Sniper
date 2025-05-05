import { CommandInteraction, Message, EmbedBuilder } from "discord.js";
import { DiscordCommand } from "@shared/schema";

export default {
  name: "version",
  description: "Check the bot version",
  category: "information",
  aliases: ["ver"],
  slash: false,
  prefix: true,
  cooldown: 3,
  permissions: [],
  options: [],
  async execute(interaction: CommandInteraction | Message) {
    if (!(interaction instanceof Message)) return;

    const packageJson = require('../../../../../package.json');

    const embed = new EmbedBuilder()
      .setTitle('Version Information')
      .setColor("#5865F2")
      .addFields([
        { name: '🤖 Bot Version', value: packageJson.version || '1.0.0', inline: true },
        { name: '📚 Discord.js', value: packageJson.dependencies['discord.js'], inline: true },
        { name: '⚙️ Node.js', value: process.version, inline: true }
      ])
      .setFooter({ text: `Requested by ${interaction.author.tag}` })
      .setTimestamp();

    return interaction.reply({ embeds: [embed] });
  }
} as DiscordCommand;