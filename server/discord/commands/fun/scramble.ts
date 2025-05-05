import { CommandInteraction, Message } from "discord.js";
import { DiscordCommand } from "@shared/schema";

export default {
  name: "scramble",
  description: "Unscramble a word",
  category: "fun",
  aliases: [],
  slash: true,
  prefix: true,
  cooldown: 3,
  permissions: [],
  options: [],
  async execute(interaction: CommandInteraction | Message) {
    if (interaction instanceof CommandInteraction) {
      return await interaction.reply({ content: `🎮 Fun command activated: Unscramble a word\nEnjoy your entertainment!` });
    } else {
      return await interaction.reply(`🎮 Fun command activated: Unscramble a word\nEnjoy your entertainment!`);
    }
  }
} as DiscordCommand;
