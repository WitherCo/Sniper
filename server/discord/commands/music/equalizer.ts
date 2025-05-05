import { CommandInteraction, Message } from "discord.js";
import { DiscordCommand } from "@shared/schema";

export default {
  name: "equalizer",
  description: "Adjust the music equalizer",
  category: "music",
  aliases: [],
  slash: true,
  prefix: true,
  cooldown: 3,
  permissions: [],
  options: [
      {
        name: "query",
        description: "The song or playlist to search for",
        type: "STRING",
        required: false
      }
    ],
  async execute(interaction: CommandInteraction | Message) {
    if (interaction instanceof CommandInteraction) {
      return await interaction.reply({ content: `🎵 Music command executed: Adjust the music equalizer\nNow enjoying your music experience!` });
    } else {
      return await interaction.reply(`🎵 Music command executed: Adjust the music equalizer\nNow enjoying your music experience!`);
    }
  }
} as DiscordCommand;
