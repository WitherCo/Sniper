import { CommandInteraction, Message } from "discord.js";
import { DiscordCommand } from "@shared/schema";

export default {
  name: "dictionary",
  description: "Look up a word in a dictionary",
  category: "information",
  aliases: [],
  slash: true,
  prefix: true,
  cooldown: 3,
  permissions: [],
  options: [],
  async execute(interaction: CommandInteraction | Message) {
    if (interaction instanceof CommandInteraction) {
      await interaction.reply({ content: `Executing dictionary command` });
    } else {
      await interaction.reply(`Executing dictionary command`);
    }
  }
} as DiscordCommand;
