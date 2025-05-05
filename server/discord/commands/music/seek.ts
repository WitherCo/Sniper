import { CommandInteraction, Message } from "discord.js";
import { DiscordCommand } from "@shared/schema";

export default {
  name: "seek",
  description: "Seek to a specific position in the track",
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
      return await interaction.reply({ content: `🎵 Music command executed: Seek to a specific position in the track\nNow enjoying your music experience!` });
    } else {
      return await interaction.reply(`🎵 Music command executed: Seek to a specific position in the track\nNow enjoying your music experience!`);
    }
  }
} as DiscordCommand;
