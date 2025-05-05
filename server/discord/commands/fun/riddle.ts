import { CommandInteraction, Message } from "discord.js";
import { DiscordCommand } from "@shared/schema";

export default {
  name: "riddle",
  description: "Get a random riddle",
  category: "fun",
  aliases: [],
  slash: true,
  prefix: true,
  cooldown: 3,
  permissions: [],
  options: [],
  async execute(interaction: CommandInteraction | Message) {
    if (interaction instanceof CommandInteraction) {
      return await interaction.reply({ content: `🎮 Fun command activated: Get a random riddle\nEnjoy your entertainment!` });
    } else {
      return await interaction.reply(`🎮 Fun command activated: Get a random riddle\nEnjoy your entertainment!`);
    }
  }
} as DiscordCommand;
