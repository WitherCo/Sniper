import { CommandInteraction, Message } from "discord.js";
import { DiscordCommand } from "@shared/schema";

export default {
  name: "nowplaying",
  description: "Show the currently playing song",
  category: "music",
  aliases: [],
  slash: true,
  prefix: true,
  cooldown: 3,
  permissions: [],
  options: [],
  async execute(interaction: CommandInteraction | Message) {
    if (interaction instanceof CommandInteraction) {
      await interaction.reply({ content: `Executing nowplaying command` });
    } else {
      await interaction.reply(`Executing nowplaying command`);
    }
  }
} as DiscordCommand;
