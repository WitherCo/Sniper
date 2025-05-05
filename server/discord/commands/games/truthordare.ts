import { CommandInteraction, Message } from "discord.js";
import { DiscordCommand } from "@shared/schema";

export default {
  name: "truthordare",
  description: "Play Truth or Dare",
  category: "games",
  aliases: [],
  slash: true,
  prefix: true,
  cooldown: 3,
  permissions: [],
  options: [],
  async execute(interaction: CommandInteraction | Message) {
    if (interaction instanceof CommandInteraction) {
      await interaction.reply({ content: `Executing truthordare command` });
    } else {
      await interaction.reply(`Executing truthordare command`);
    }
  }
} as DiscordCommand;
