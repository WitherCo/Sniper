import { CommandInteraction, Message } from "discord.js";
import { DiscordCommand } from "@shared/schema";

export default {
  name: "anagrams",
  description: "Solve anagram puzzles",
  category: "games",
  aliases: [],
  slash: true,
  prefix: true,
  cooldown: 3,
  permissions: [],
  options: [],
  async execute(interaction: CommandInteraction | Message) {
    if (interaction instanceof CommandInteraction) {
      await interaction.reply({ content: `Executing anagrams command` });
    } else {
      await interaction.reply(`Executing anagrams command`);
    }
  }
} as DiscordCommand;
