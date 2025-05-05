import { CommandInteraction, Message } from "discord.js";
import { DiscordCommand } from "@shared/schema";

export default {
  name: "ascii",
  description: "Convert text to ASCII art",
  category: "fun",
  aliases: [],
  slash: true,
  prefix: true,
  cooldown: 3,
  permissions: [],
  options: [],
  async execute(interaction: CommandInteraction | Message) {
    if (interaction instanceof CommandInteraction) {
      await interaction.reply({ content: `Executing ascii command` });
    } else {
      await interaction.reply(`Executing ascii command`);
    }
  }
} as DiscordCommand;
