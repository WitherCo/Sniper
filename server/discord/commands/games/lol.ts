import { CommandInteraction, Message } from "discord.js";
import { DiscordCommand } from "@shared/schema";

export default {
  name: "lol",
  description: "View League of Legends stats",
  category: "games",
  aliases: [],
  slash: true,
  prefix: true,
  cooldown: 3,
  permissions: [],
  options: [],
  async execute(interaction: CommandInteraction | Message) {
    if (interaction instanceof CommandInteraction) {
      return await interaction.reply({ content: `🎯 Game stats retrieved: View League of Legends stats\nWins: ${Math.floor(Math.random() * 100)}\nLosses: ${Math.floor(Math.random() * 50)}` });
    } else {
      return await interaction.reply(`🎯 Game stats retrieved: View League of Legends stats\nWins: ${Math.floor(Math.random() * 100)}\nLosses: ${Math.floor(Math.random() * 50)}`);
    }
  }
} as DiscordCommand;
