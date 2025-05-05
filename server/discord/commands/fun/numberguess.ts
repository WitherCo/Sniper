import { CommandInteraction, Message } from "discord.js";
import { DiscordCommand } from "@shared/schema";

export default {
  name: "numberguess",
  description: "Guess a number between 1 and 100",
  category: "fun",
  aliases: [],
  slash: true,
  prefix: true,
  cooldown: 3,
  permissions: [],
  options: [],
  async execute(interaction: CommandInteraction | Message) {
    if (interaction instanceof CommandInteraction) {
      return await interaction.reply({ content: `🎮 Fun command activated: Guess a number between 1 and 100\nEnjoy your entertainment!` });
    } else {
      return await interaction.reply(`🎮 Fun command activated: Guess a number between 1 and 100\nEnjoy your entertainment!`);
    }
  }
} as DiscordCommand;
