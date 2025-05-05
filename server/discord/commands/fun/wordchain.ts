import { CommandInteraction, Message } from "discord.js";
import { DiscordCommand } from "@shared/schema";

export default {
  name: "wordchain",
  description: "Play a word chain game",
  category: "fun",
  aliases: [],
  slash: true,
  prefix: true,
  cooldown: 3,
  permissions: [],
  options: [],
  async execute(interaction: CommandInteraction | Message) {
    if (interaction instanceof CommandInteraction) {
      return await interaction.reply({ content: `🎮 Fun command activated: Play a word chain game\nEnjoy your entertainment!` });
    } else {
      return await interaction.reply(`🎮 Fun command activated: Play a word chain game\nEnjoy your entertainment!`);
    }
  }
} as DiscordCommand;
